"use server";

import { CourseStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { orderSchema } from "@/lib/validation/schemas";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { isEnrolled } from "@/lib/permissions";
import { calculateOrderAmounts } from "@/lib/payments/pricing";
import {
  checkoutOrder,
  getPaymentProviderName,
  refundProviderPayment,
} from "@/lib/payments/index";
import type { PaymentProviderName } from "@/lib/payments/types";
import {
  fulfillPaidOrder,
  recordFailedPayment,
} from "@/lib/services/fulfill-order";
import { sendPaymentFailedEmail, sendRefundEmail } from "@/lib/email";
import { failure, success, type ActionResult } from "@/lib/actions/types";
import { UserRole } from "@prisma/client";
import { toNumber } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

async function executeOrderRefund(
  orderId: string,
  actorUserId: string,
  auditAction: "REFUND_REQUESTED" | "ADMIN_REFUND",
): Promise<ActionResult<{ message: string }>> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      course: { select: { title: true } },
      student: { select: { email: true, name: true } },
      enrollments: true,
      payments: {
        where: { status: PaymentStatus.COMPLETED },
        orderBy: { paidAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) return failure("الطلب غير موجود");
  if (order.status === OrderStatus.REFUNDED) {
    return failure("تم استرداد هذا الطلب مسبقاً");
  }
  if (order.status !== OrderStatus.PAID) {
    return failure("لا يمكن استرداد هذا الطلب");
  }

  const amount = toNumber(order.amount);
  const payment = order.payments[0];

  if (payment?.providerRef) {
    const refund = await refundProviderPayment(payment.providerRef, amount);
    if (!refund.success) {
      return failure(refund.error ?? "فشل استرداد بوابة الدفع");
    }
    await db.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.REFUNDED },
  });

  for (const enrollment of order.enrollments) {
    if (enrollment.status !== "CANCELLED") {
      await db.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "CANCELLED" },
      });
    }
  }

  await createAuditLog({
    userId: actorUserId,
    action: auditAction,
    entityType: "Order",
    entityId: orderId,
  });

  await sendRefundEmail(
    order.student.email,
    order.student.name,
    order.course.title,
    amount,
  );

  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/orders");
  return success({ message: "تم استرداد المبلغ." });
}

export async function createOrder(
  formData: FormData,
): Promise<ActionResult<{ orderId: string; amount: number }>> {
  const user = await requireAuth();

  const parsed = orderSchema.safeParse({
    courseId: formData.get("courseId"),
    couponCode: formData.get("couponCode") || undefined,
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  const course = await db.course.findUnique({
    where: { id: parsed.data.courseId },
  });

  if (!course || course.status !== CourseStatus.PUBLISHED) {
    return failure("الدورة غير متاحة للشراء");
  }

  const price = toNumber(course.price);
  if (price === 0) {
    return failure("هذه دورة مجانية. استخدم التسجيل المباشر.");
  }

  if (await isEnrolled(user.id, course.id)) {
    return failure("أنت مسجل في هذه الدورة بالفعل");
  }

  const pendingOrder = await db.order.findFirst({
    where: {
      studentId: user.id,
      courseId: course.id,
      status: OrderStatus.PENDING,
    },
  });

  if (pendingOrder) {
    return success({
      orderId: pendingOrder.id,
      amount: toNumber(pendingOrder.amount),
    });
  }

  let coupon = null;
  if (parsed.data.couponCode) {
    coupon = await db.coupon.findFirst({
      where: {
        code: parsed.data.couponCode.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (!coupon) return failure("كود الخصم غير صالح");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return failure("انتهت صلاحية كود الخصم");
    }
  }

  const settings = await db.platformSettings.findUnique({
    where: { id: "default" },
  });

  const amounts = calculateOrderAmounts(
    price,
    coupon
      ? {
          discountType: coupon.discountType,
          discountValue: toNumber(coupon.discountValue),
        }
      : undefined,
    {
      vatPercent: toNumber(settings?.vatPercent ?? 15),
      commissionPercent: toNumber(settings?.commissionPercent ?? 20),
    },
  );

  const order = await db.order.create({
    data: {
      studentId: user.id,
      courseId: course.id,
      instructorId: course.instructorId,
      amount: amounts.amount,
      taxAmount: amounts.taxAmount,
      commissionAmount: amounts.commissionAmount,
      instructorNetAmount: amounts.instructorNetAmount,
      couponId: coupon?.id,
      status: OrderStatus.PENDING,
    },
  });

  return success({ orderId: order.id, amount: amounts.amount });
}

export async function processPayment(
  orderId: string,
): Promise<
  ActionResult<{ message: string; checkoutUrl?: string }>
> {
  const user = await requireAuth();

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { course: true },
  });

  if (!order || order.studentId !== user.id) {
    return failure("الطلب غير موجود");
  }

  if (order.status !== OrderStatus.PENDING) {
    return failure("الطلب غير قابل للدفع");
  }

  const amount = toNumber(order.amount);
  const checkout = await checkoutOrder({
    orderId,
    amount,
    courseTitle: order.course.title,
    courseSlug: order.course.slug,
    studentEmail: user.email,
  });

  if (checkout.type === "redirect") {
    return success({
      message: "جاري التحويل لبوابة الدفع",
      checkoutUrl: checkout.url,
    });
  }

  if (!checkout.payment.success) {
    await recordFailedPayment(orderId, amount, checkout.payment.error);
    await sendPaymentFailedEmail(
      user.email,
      user.name,
      order.course.title,
      checkout.payment.error,
    );
    return failure(checkout.payment.error);
  }

  const fulfilled = await fulfillPaidOrder(
    orderId,
    checkout.payment.providerRef,
    user.id,
  );

  if (!fulfilled.success) {
    return failure(fulfilled.error);
  }

  return success({ message: "تم الدفع بنجاح! يمكنك البدء بالتعلم." });
}

/** @deprecated استخدم processPayment */
export async function processMockPayment(
  orderId: string,
): Promise<ActionResult<{ message: string }>> {
  const result = await processPayment(orderId);
  if (!result.success) return result;
  return success({ message: result.data.message });
}

export async function getPaymentProvider(): Promise<PaymentProviderName> {
  return getPaymentProviderName();
}

export async function requestRefund(
  orderId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      course: {
        include: {
          sections: { include: { lessons: { where: { isPublished: true } } } },
        },
      },
      enrollments: { include: { progress: true } },
    },
  });

  if (!order || order.studentId !== user.id) {
    return failure("الطلب غير موجود");
  }

  if (order.status !== OrderStatus.PAID) {
    return failure("لا يمكن استرداد هذا الطلب");
  }

  const settings = await db.platformSettings.findUnique({
    where: { id: "default" },
  });

  const refundDays = settings?.refundDays ?? 7;
  const maxProgress = settings?.refundMaxProgressPercent ?? 20;

  const daysSinceOrder =
    (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceOrder > refundDays) {
    return failure(`انتهت فترة الاسترداد (${refundDays} أيام)`);
  }

  const enrollment = order.enrollments[0];
  if (enrollment) {
    const totalLessons = order.course.sections.flatMap((s) => s.lessons).length;
    const completed = enrollment.progress.filter((p) => p.completedAt).length;
    const progressPercent =
      totalLessons > 0 ? (completed / totalLessons) * 100 : 0;

    if (progressPercent > maxProgress) {
      return failure(
        `تجاوزت نسبة التقدم المسموحة للاسترداد (${maxProgress}%)`,
      );
    }
  }

  return executeOrderRefund(orderId, user.id, "REFUND_REQUESTED");
}

export async function adminRefund(
  orderId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireRole(UserRole.ADMIN);
  return executeOrderRefund(orderId, user.id, "ADMIN_REFUND");
}

export async function getMyOrders() {
  const user = await requireAuth();

  return db.order.findMany({
    where: { studentId: user.id },
    include: {
      course: { select: { title: true, slug: true, thumbnail: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllOrders() {
  await requireRole(UserRole.ADMIN);

  return db.order.findMany({
    include: {
      student: { select: { name: true, email: true } },
      course: { select: { title: true } },
      instructor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
