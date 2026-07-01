"use server";

import {
  CourseStatus,
  UserRole,
  type CourseLevel,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { courseSchema, lessonSchema } from "@/lib/validation/schemas";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { canEditCourse } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { failure, success, type ActionResult } from "@/lib/actions/types";
import { z } from "zod";

const sectionSchema = z.object({
  title: z.string().min(2).max(200),
  order: z.number().int().min(0).default(0),
  courseId: z.string().cuid(),
});

export async function createCourse(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(UserRole.INSTRUCTOR);

  const learningOutcomes = formData.getAll("learningOutcomes").map(String).filter(Boolean);
  const requirements = formData.getAll("requirements").map(String).filter(Boolean);

  const raw = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || undefined,
    categoryId: formData.get("categoryId"),
    level: formData.get("level"),
    price: Number(formData.get("price") ?? 0),
    durationHours: Number(formData.get("durationHours") ?? 0),
    learningOutcomes,
    requirements,
    thumbnail: formData.get("thumbnail") || undefined,
  };

  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }

  const existingSlug = await db.course.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existingSlug) {
    return failure("رابط الدورة مستخدم بالفعل");
  }

  const course = await db.course.create({
    data: {
      ...parsed.data,
      instructorId: user.id,
      status: CourseStatus.DRAFT,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "COURSE_CREATED",
    entityType: "Course",
    entityId: course.id,
  });

  revalidatePath("/instructor/courses");
  return success({ id: course.id });
}

export async function updateCourse(
  courseId: string,
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return failure("الدورة غير موجودة");

  if (!(await canEditCourse(user, course))) {
    return failure("ليس لديك صلاحية تعديل هذه الدورة");
  }

  if (
    course.status !== CourseStatus.DRAFT &&
    course.status !== CourseStatus.REJECTED &&
    user.role !== UserRole.ADMIN
  ) {
    return failure("لا يمكن تعديل دورة منشورة أو قيد المراجعة");
  }

  const learningOutcomes = formData.getAll("learningOutcomes").map(String).filter(Boolean);
  const requirements = formData.getAll("requirements").map(String).filter(Boolean);

  const raw = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || undefined,
    categoryId: formData.get("categoryId"),
    level: formData.get("level"),
    price: Number(formData.get("price") ?? 0),
    durationHours: Number(formData.get("durationHours") ?? 0),
    learningOutcomes,
    requirements,
    thumbnail: formData.get("thumbnail") || undefined,
  };

  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }

  if (parsed.data.slug !== course.slug) {
    const slugTaken = await db.course.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (slugTaken) return failure("رابط الدورة مستخدم بالفعل");
  }

  await db.course.update({
    where: { id: courseId },
    data: parsed.data,
  });

  revalidatePath(`/instructor/courses/${courseId}/edit`);
  revalidatePath("/instructor/courses");
  return success({ message: "تم تحديث الدورة." });
}

export async function submitForReview(
  courseId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireRole(UserRole.INSTRUCTOR);

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { sections: { include: { lessons: true } } },
  });

  if (!course || course.instructorId !== user.id) {
    return failure("الدورة غير موجودة");
  }

  if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
    return failure("لا يمكن إرسال هذه الدورة للمراجعة");
  }

  const lessonCount = course.sections.reduce(
    (acc, s) => acc + s.lessons.length,
    0,
  );
  if (lessonCount === 0) {
    return failure("يجب إضافة دروس قبل إرسال الدورة للمراجعة");
  }

  await db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.UNDER_REVIEW, rejectionReason: null },
  });

  await createAuditLog({
    userId: user.id,
    action: "COURSE_SUBMITTED",
    entityType: "Course",
    entityId: courseId,
  });

  revalidatePath("/instructor/courses");
  revalidatePath("/admin/courses/review");
  return success({ message: "تم إرسال الدورة للمراجعة." });
}

export async function publishCourse(
  courseId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireRole(UserRole.ADMIN);

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return failure("الدورة غير موجودة");

  if (course.status !== CourseStatus.UNDER_REVIEW) {
    return failure("يمكن نشر الدورات قيد المراجعة فقط");
  }

  await db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.PUBLISHED, publishedAt: new Date() },
  });

  await createAuditLog({
    userId: user.id,
    action: "COURSE_PUBLISHED",
    entityType: "Course",
    entityId: courseId,
  });

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return success({ message: "تم نشر الدورة." });
}

export async function rejectCourse(
  courseId: string,
  reason: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireRole(UserRole.ADMIN);

  if (!reason || reason.length < 5) {
    return failure("يرجى ذكر سبب الرفض");
  }

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== CourseStatus.UNDER_REVIEW) {
    return failure("الدورة غير متاحة للرفض");
  }

  await db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.REJECTED, rejectionReason: reason },
  });

  await createAuditLog({
    userId: user.id,
    action: "COURSE_REJECTED",
    entityType: "Course",
    entityId: courseId,
    metadata: { reason },
  });

  revalidatePath("/admin/courses/review");
  return success({ message: "تم رفض الدورة." });
}

export async function archiveCourse(
  courseId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return failure("الدورة غير موجودة");

  const canArchive =
    user.role === UserRole.ADMIN ||
    (user.role === UserRole.INSTRUCTOR && course.instructorId === user.id);

  if (!canArchive) return failure("ليس لديك صلاحية");

  await db.course.update({
    where: { id: courseId },
    data: { status: CourseStatus.ARCHIVED },
  });

  revalidatePath("/instructor/courses");
  revalidatePath("/admin/courses");
  return success({ message: "تم أرشفة الدورة." });
}

export async function createSection(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();

  const parsed = sectionSchema.safeParse({
    title: formData.get("title"),
    order: Number(formData.get("order") ?? 0),
    courseId: formData.get("courseId"),
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  const course = await db.course.findUnique({
    where: { id: parsed.data.courseId },
  });
  if (!course || !(await canEditCourse(user, course))) {
    return failure("ليس لديك صلاحية");
  }

  const section = await db.section.create({ data: parsed.data });
  revalidatePath(`/instructor/courses/${parsed.data.courseId}/edit`);
  return success({ id: section.id });
}

export async function updateSection(
  sectionId: string,
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });
  if (!section || !(await canEditCourse(user, section.course))) {
    return failure("ليس لديك صلاحية");
  }

  const title = String(formData.get("title") ?? "").trim();
  const order = Number(formData.get("order") ?? section.order);

  await db.section.update({
    where: { id: sectionId },
    data: { title, order },
  });

  revalidatePath(`/instructor/courses/${section.courseId}/edit`);
  return success({ message: "تم تحديث القسم." });
}

export async function deleteSection(
  sectionId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });
  if (!section || !(await canEditCourse(user, section.course))) {
    return failure("ليس لديك صلاحية");
  }

  await db.section.delete({ where: { id: sectionId } });
  revalidatePath(`/instructor/courses/${section.courseId}/edit`);
  return success({ message: "تم حذف القسم." });
}

export async function createLesson(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();

  const parsed = lessonSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    content: formData.get("content") || undefined,
    videoRef: formData.get("videoRef") || undefined,
    fileRef: formData.get("fileRef") || undefined,
    order: Number(formData.get("order") ?? 0),
    durationMinutes: formData.get("durationMinutes")
      ? Number(formData.get("durationMinutes"))
      : undefined,
    isFreePreview: formData.get("isFreePreview") === "true",
    isPublished: formData.get("isPublished") !== "false",
    sectionId: formData.get("sectionId"),
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  const section = await db.section.findUnique({
    where: { id: parsed.data.sectionId },
    include: { course: true },
  });
  if (!section || !(await canEditCourse(user, section.course))) {
    return failure("ليس لديك صلاحية");
  }

  const lesson = await db.lesson.create({ data: parsed.data });
  revalidatePath(`/instructor/courses/${section.courseId}/edit`);
  return success({ id: lesson.id });
}

export async function updateLesson(
  lessonId: string,
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });
  if (!lesson || !(await canEditCourse(user, lesson.section.course))) {
    return failure("ليس لديك صلاحية");
  }

  const parsed = lessonSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    content: formData.get("content") || undefined,
    videoRef: formData.get("videoRef") || undefined,
    fileRef: formData.get("fileRef") || undefined,
    order: Number(formData.get("order") ?? lesson.order),
    durationMinutes: formData.get("durationMinutes")
      ? Number(formData.get("durationMinutes"))
      : undefined,
    isFreePreview: formData.get("isFreePreview") === "true",
    isPublished: formData.get("isPublished") !== "false",
    sectionId: lesson.sectionId,
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  await db.lesson.update({
    where: { id: lessonId },
    data: parsed.data,
  });

  revalidatePath(`/instructor/courses/${lesson.section.courseId}/edit`);
  return success({ message: "تم تحديث الدرس." });
}

export async function deleteLesson(
  lessonId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });
  if (!lesson || !(await canEditCourse(user, lesson.section.course))) {
    return failure("ليس لديك صلاحية");
  }

  const courseId = lesson.section.courseId;
  await db.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/instructor/courses/${courseId}/edit`);
  return success({ message: "تم حذف الدرس." });
}

export async function getCourses(filters?: {
  search?: string;
  categoryId?: string;
  level?: CourseLevel;
  priceType?: "free" | "paid";
  page?: number;
  limit?: number;
}) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 12;
  const skip = (page - 1) * limit;

  const where: {
    status: CourseStatus;
    OR?: Array<{ title?: { contains: string; mode: "insensitive" }; description?: { contains: string; mode: "insensitive" } }>;
    categoryId?: string;
    level?: CourseLevel;
    price?: number | { gt: number };
  } = {
    status: CourseStatus.PUBLISHED,
  };

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.level) where.level = filters.level;
  if (filters?.priceType === "free") where.price = 0;
  if (filters?.priceType === "paid") where.price = { gt: 0 };

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      include: {
        category: true,
        instructor: { select: { name: true, image: true } },
        _count: { select: { enrollments: true, reviews: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    db.course.count({ where }),
  ]);

  return { courses, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getReviewCourses() {
  await requireRole(UserRole.ADMIN);

  return db.course.findMany({
    where: { status: CourseStatus.UNDER_REVIEW },
    include: {
      instructor: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCourseBySlug(slug: string) {
  return db.course.findUnique({
    where: { slug },
    include: {
      category: true,
      instructor: { select: { id: true, name: true, bio: true, image: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
          },
        },
      },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      quizzes: true,
      _count: { select: { enrollments: true } },
    },
  });
}
