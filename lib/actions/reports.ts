"use server";

import {
  CourseStatus,
  OrderStatus,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { toNumber } from "@/lib/utils";

export async function getDashboardStats() {
  await requireRole(UserRole.ADMIN);

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
    db.user.count(),
    db.course.count(),
    db.course.count({ where: { status: CourseStatus.PUBLISHED } }),
    db.course.count({ where: { status: CourseStatus.UNDER_REVIEW } }),
    db.order.count(),
    db.order.count({ where: { status: OrderStatus.PAID } }),
    db.order.aggregate({
      where: { status: OrderStatus.PAID },
      _sum: { amount: true },
    }),
    db.enrollment.count(),
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
      _count: { select: { enrollments: true, reviews: true } },
      orders: {
        where: { status: OrderStatus.PAID },
        select: { amount: true },
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

  return {
    course,
    revenue,
    averageRating: reviews._avg.rating ?? 0,
  };
}

export async function getFinancialReport() {
  await requireRole(UserRole.ADMIN);

  const orders = await db.order.findMany({
    where: { status: OrderStatus.PAID },
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
