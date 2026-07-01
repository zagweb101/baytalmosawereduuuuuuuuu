"use server";

import {
  CourseStatus,
  OrderStatus,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { toNumber } from "@/lib/utils";
import { failure, success, type ActionResult } from "@/lib/actions/types";

function parseDateRange(dateFrom?: string, dateTo?: string) {
  const from = dateFrom ? new Date(dateFrom) : undefined;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : undefined;
  const createdAt =
    from || to
      ? {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        }
      : undefined;
  return createdAt;
}

export async function getDashboardStats(dateFrom?: string, dateTo?: string) {
  await requireRole(UserRole.ADMIN);

  const createdAt = parseDateRange(dateFrom, dateTo);
  const userWhere = createdAt ? { createdAt } : {};
  const orderWhere = createdAt
    ? { createdAt, status: OrderStatus.PAID }
    : { status: OrderStatus.PAID };
  const enrollmentWhere = createdAt ? { enrolledAt: createdAt } : {};

  const [
    totalUsers,
    totalCourses,
    publishedCourses,
    pendingCourses,
    totalOrders,
    paidOrders,
    totalRevenue,
    totalEnrollments,
  ] = await Promise.all([
    db.user.count({ where: userWhere }),
    db.course.count(createdAt ? { where: { createdAt } } : undefined),
    db.course.count({ where: { status: CourseStatus.PUBLISHED } }),
    db.course.count({ where: { status: CourseStatus.UNDER_REVIEW } }),
    db.order.count(createdAt ? { where: { createdAt } } : undefined),
    db.order.count({ where: orderWhere }),
    db.order.aggregate({
      where: orderWhere,
      _sum: { amount: true },
    }),
    db.enrollment.count({ where: enrollmentWhere }),
  ]);

  return {
    totalUsers,
    totalCourses,
    publishedCourses,
    pendingCourses,
    totalOrders,
    paidOrders,
    totalRevenue: toNumber(totalRevenue._sum.amount ?? 0),
    totalEnrollments,
  };
}

export async function getInstructorStats(instructorId: string) {
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN && user.id !== instructorId) {
    throw new Error("غير مصرح");
  }

  const [courses, enrollments, revenue, pendingReview] = await Promise.all([
    db.course.count({ where: { instructorId } }),
    db.enrollment.count({
      where: { course: { instructorId } },
    }),
    db.order.aggregate({
      where: { instructorId, status: OrderStatus.PAID },
      _sum: { instructorNetAmount: true },
    }),
    db.course.count({
      where: { instructorId, status: CourseStatus.UNDER_REVIEW },
    }),
  ]);

  return {
    courses,
    enrollments,
    revenue: toNumber(revenue._sum.instructorNetAmount ?? 0),
    pendingReview,
  };
}

export async function getCourseReport(courseId: string) {
  await requireRole(UserRole.ADMIN);

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { name: true } },
      sections: {
        include: { lessons: { where: { isPublished: true } } },
      },
      _count: { select: { enrollments: true, reviews: true } },
      orders: {
        where: { status: OrderStatus.PAID },
        select: { amount: true },
      },
      enrollments: {
        include: { progress: true },
      },
    },
  });

  if (!course) return null;

  const revenue = course.orders.reduce(
    (sum, o) => sum + toNumber(o.amount),
    0,
  );

  const reviews = await db.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
  });

  const totalLessons = course.sections.flatMap((s) => s.lessons).length;
  let completedCount = 0;
  for (const enrollment of course.enrollments) {
    const done = enrollment.progress.filter((p) => p.completedAt).length;
    if (totalLessons > 0 && done >= totalLessons) completedCount++;
  }
  const completionRate =
    course.enrollments.length > 0
      ? Math.round((completedCount / course.enrollments.length) * 100)
      : 0;

  return {
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      instructor: course.instructor,
      _count: course._count,
    },
    revenue,
    averageRating: reviews._avg.rating ?? 0,
    completionRate,
  };
}

export async function getFinancialReport(
  dateFrom?: string,
  dateTo?: string,
) {
  await requireRole(UserRole.ADMIN);

  const createdAt = parseDateRange(dateFrom, dateTo);

  const orders = await db.order.findMany({
    where: {
      status: OrderStatus.PAID,
      ...(createdAt ? { createdAt } : {}),
    },
    include: {
      course: { select: { title: true } },
      student: { select: { name: true } },
      instructor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = orders.reduce(
    (acc, o) => ({
      gross: acc.gross + toNumber(o.amount),
      tax: acc.tax + toNumber(o.taxAmount),
      commission: acc.commission + toNumber(o.commissionAmount),
      instructorNet: acc.instructorNet + toNumber(o.instructorNetAmount),
    }),
    { gross: 0, tax: 0, commission: 0, instructorNet: 0 },
  );

  return { orders, totals };
}

export async function exportFinancialReportCsv(
  dateFrom?: string,
  dateTo?: string,
): Promise<ActionResult<{ csv: string }>> {
  await requireRole(UserRole.ADMIN);
  const { orders } = await getFinancialReport(dateFrom, dateTo);

  const header = "التاريخ,الطالب,الدورة,المدرب,المبلغ,الضريبة,العمولة,صافي المدرب";
  const rows = orders.map((o) =>
    [
      o.createdAt.toISOString().slice(0, 10),
      `"${o.student.name.replace(/"/g, '""')}"`,
      `"${o.course.title.replace(/"/g, '""')}"`,
      `"${o.instructor.name.replace(/"/g, '""')}"`,
      toNumber(o.amount).toFixed(2),
      toNumber(o.taxAmount).toFixed(2),
      toNumber(o.commissionAmount).toFixed(2),
      toNumber(o.instructorNetAmount).toFixed(2),
    ].join(","),
  );

  return success({ csv: "\uFEFF" + [header, ...rows].join("\n") });
}

export async function getPublishedCoursesForReport() {
  await requireRole(UserRole.ADMIN);
  return db.course.findMany({
    where: { status: CourseStatus.PUBLISHED },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
}

export async function getStudentDashboardStats(userId: string) {
  const user = await requireAuth();
  if (user.id !== userId && user.role !== UserRole.ADMIN) {
    throw new Error("غير مصرح");
  }

  const [enrollments, certificates, orders] = await Promise.all([
    db.enrollment.count({ where: { studentId: userId } }),
    db.certificate.count({ where: { userId } }),
    db.order.count({ where: { studentId: userId, status: OrderStatus.PAID } }),
  ]);

  return { enrollments, certificates, orders };
}
