"use server";

import {
  CourseStatus,
  EnrollmentStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { isEnrolled } from "@/lib/permissions";
import { sendEnrollmentEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications/create";
import { failure, success, type ActionResult } from "@/lib/actions/types";
import { toNumber } from "@/lib/utils";

export async function enrollFree(
  courseId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return failure("الدورة غير موجودة");

  if (course.status !== CourseStatus.PUBLISHED) {
    return failure("الدورة غير متاحة للتسجيل");
  }

  const price = toNumber(course.price);
  if (price > 0) {
    return failure("هذه دورة مدفوعة. يرجى إتمام عملية الشراء.");
  }

  const alreadyEnrolled = await isEnrolled(user.id, courseId);
  if (alreadyEnrolled) {
    return failure("أنت مسجل في هذه الدورة بالفعل");
  }

  await db.enrollment.create({
    data: {
      studentId: user.id,
      courseId,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  await sendEnrollmentEmail(user.email, user.name, course.title);

  await createNotification({
    userId: user.id,
    title: "تم التسجيل في الدورة",
    body: `أنت الآن مسجل في «${course.title}»`,
    type: "ENROLLMENT",
    link: `/dashboard/courses/${courseId}/learn`,
  });

  await createAuditLog({
    userId: user.id,
    action: "ENROLLMENT_FREE",
    entityType: "Enrollment",
    entityId: courseId,
  });

  revalidatePath("/dashboard/my-courses");
  revalidatePath(`/courses/${course.slug}`);
  return success({ message: "تم التسجيل في الدورة بنجاح!" });
}

export async function getProgress(courseId: string) {
  const user = await requireAuth();

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: user.id, courseId },
    },
    include: {
      progress: true,
      course: {
        include: {
          sections: {
            include: {
              lessons: { where: { isPublished: true } },
            },
          },
        },
      },
    },
  });

  if (!enrollment) return null;

  const allLessons = enrollment.course.sections.flatMap((s) => s.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = enrollment.progress.filter((p) => p.completedAt).length;
  const percent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    enrollment,
    totalLessons,
    completedLessons,
    percent,
    lastViewed: enrollment.progress
      .filter((p) => p.lastViewedAt)
      .sort(
        (a, b) =>
          (b.lastViewedAt?.getTime() ?? 0) - (a.lastViewedAt?.getTime() ?? 0),
      )[0],
  };
}

export async function markLessonComplete(
  lessonId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: true },
  });
  if (!lesson) return failure("الدرس غير موجود");

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId: lesson.section.courseId,
      },
    },
  });

  if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
    return failure("يجب التسجيل في الدورة أولاً");
  }

  await db.progress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId,
      },
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      completedAt: new Date(),
      lastViewedAt: new Date(),
    },
    update: {
      completedAt: new Date(),
      lastViewedAt: new Date(),
    },
  });

  revalidatePath(`/dashboard/courses/${lesson.section.courseId}/learn`);
  return success({ message: "تم إكمال الدرس." });
}

export async function updateLastViewed(
  lessonId: string,
): Promise<ActionResult<void>> {
  const user = await requireAuth();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: true },
  });
  if (!lesson) return failure("الدرس غير موجود");

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: user.id,
        courseId: lesson.section.courseId,
      },
    },
  });

  if (!enrollment) return failure("غير مسجل");

  await db.progress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId,
      },
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      lastViewedAt: new Date(),
    },
    update: { lastViewedAt: new Date() },
  });

  return success(undefined as void);
}

export async function getMyCourses() {
  const user = await requireAuth();

  return db.enrollment.findMany({
    where: { studentId: user.id, status: EnrollmentStatus.ACTIVE },
    include: {
      course: {
        include: {
          category: true,
          instructor: { select: { name: true } },
          sections: { include: { lessons: { where: { isPublished: true } } } },
        },
      },
      progress: true,
    },
    orderBy: { enrolledAt: "desc" },
  });
}

export async function getContinueLearning() {
  const user = await requireAuth();

  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id, status: EnrollmentStatus.ACTIVE },
    include: {
      course: {
        include: {
          sections: {
            include: { lessons: { where: { isPublished: true } } },
          },
        },
      },
      progress: true,
    },
  });

  return enrollments
    .filter((e) => e.progress.some((p) => p.lastViewedAt))
    .slice(0, 3);
}

export async function getAdminEnrollments() {
  await requireRole(UserRole.ADMIN);

  return db.enrollment.findMany({
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { enrolledAt: "desc" },
    take: 100,
  });
}

export async function cancelEnrollment(
  enrollmentId: string,
): Promise<ActionResult<{ message: string }>> {
  const admin = await requireRole(UserRole.ADMIN);

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: { select: { slug: true } } },
  });

  if (!enrollment) return failure("التسجيل غير موجود");
  if (enrollment.status === EnrollmentStatus.CANCELLED) {
    return failure("التسجيل ملغى مسبقاً");
  }

  await db.enrollment.update({
    where: { id: enrollmentId },
    data: { status: EnrollmentStatus.CANCELLED },
  });

  await createAuditLog({
    userId: admin.id,
    action: "ENROLLMENT_CANCELLED",
    entityType: "Enrollment",
    entityId: enrollmentId,
  });

  revalidatePath("/admin/enrollments");
  revalidatePath(`/courses/${enrollment.course.slug}`);
  return success({ message: "تم إلغاء التسجيل." });
}

