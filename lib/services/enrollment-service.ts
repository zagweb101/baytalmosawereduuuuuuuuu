import { EnrollmentStatus, OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { sendEnrollmentEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications/create";

/** داخلي — يُستدعى فقط بعد تأكيد الدفع من orders */
export async function createEnrollmentAfterPayment(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { course: true, student: true },
  });

  if (!order || order.status !== OrderStatus.PAID) return;

  const existing = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: order.studentId,
        courseId: order.courseId,
      },
    },
  });

  if (existing) return;

  await db.enrollment.create({
    data: {
      studentId: order.studentId,
      courseId: order.courseId,
      orderId: order.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  await sendEnrollmentEmail(
    order.student.email,
    order.student.name,
    order.course.title,
  );

  await createNotification({
    userId: order.studentId,
    title: "تم التسجيل في الدورة",
    body: `أنت الآن مسجل في «${order.course.title}»`,
    type: "ENROLLMENT",
    link: `/dashboard/courses/${order.courseId}/learn`,
  });
}
