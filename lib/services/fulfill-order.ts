import { OrderStatus, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createEnrollmentAfterPayment } from "@/lib/services/enrollment-service";
import { createNotification } from "@/lib/notifications/create";
import { createAuditLog } from "@/lib/audit";
import { sendPaymentSuccessEmail } from "@/lib/email";
import { toNumber } from "@/lib/utils";

export async function fulfillPaidOrder(
  orderId: string,
  providerRef: string,
  actorUserId?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { course: true, student: { select: { email: true, name: true } } },
  });

  if (!order) {
    return { success: false, error: "الطلب غير موجود" };
  }

  if (order.status === OrderStatus.PAID) {
    return { success: true };
  }

  if (order.status !== OrderStatus.PENDING) {
    return { success: false, error: "الطلب غير قابل للدفع" };
  }

  const amount = toNumber(order.amount);

  await db.payment.create({
    data: {
      orderId,
      amount,
      status: PaymentStatus.COMPLETED,
      providerRef,
      paidAt: new Date(),
    },
  });

  await db.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.PAID },
  });

  if (order.couponId) {
    await db.coupon.update({
      where: { id: order.couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  await createEnrollmentAfterPayment(orderId);

  await sendPaymentSuccessEmail(
    order.student.email,
    order.student.name,
    order.course.title,
    amount,
  );

  await createNotification({
    userId: order.studentId,
    title: "تم الدفع بنجاح",
    body: `تم تأكيد طلبك لدورة «${order.course.title}»`,
    type: "PAYMENT",
    link: `/dashboard/courses/${order.courseId}/learn`,
  });

  if (actorUserId) {
    await createAuditLog({
      userId: actorUserId,
      action: "ORDER_PAID",
      entityType: "Order",
      entityId: orderId,
    });
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/my-courses");
  return { success: true };
}

export async function recordFailedPayment(
  orderId: string,
  amount: number,
  reason: string,
): Promise<void> {
  await db.payment.create({
    data: {
      orderId,
      amount,
      status: PaymentStatus.FAILED,
      failureReason: reason,
    },
  });
  await db.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.FAILED },
  });
}
