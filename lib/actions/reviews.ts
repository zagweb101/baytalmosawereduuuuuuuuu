"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validation/schemas";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { isEnrolled } from "@/lib/permissions";
import { failure, success, type ActionResult } from "@/lib/actions/types";
import { UserRole } from "@prisma/client";

export async function addReview(
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const parsed = reviewSchema.safeParse({
    courseId: formData.get("courseId"),
    rating: Number(formData.get("rating")),
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  if (!(await isEnrolled(user.id, parsed.data.courseId))) {
    return failure("يجب التسجيل في الدورة لإضافة تقييم");
  }

  const existing = await db.review.findUnique({
    where: {
      courseId_userId: {
        courseId: parsed.data.courseId,
        userId: user.id,
      },
    },
  });

  if (existing) return failure("لديك تقييم لهذه الدورة بالفعل");

  const course = await db.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { slug: true },
  });

  await db.review.create({
    data: {
      ...parsed.data,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard/my-courses");
  if (course) revalidatePath(`/courses/${course.slug}`);
  return success({ message: "تم إضافة التقييم." });
}

export async function getUserReview(courseId: string) {
  const user = await requireAuth();

  return db.review.findUnique({
    where: {
      courseId_userId: { courseId, userId: user.id },
    },
  });
}

export async function updateReview(
  reviewId: string,
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: { course: { select: { slug: true } } },
  });
  if (!review || review.userId !== user.id) {
    return failure("التقييم غير موجود");
  }

  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (rating < 1 || rating > 5) return failure("التقييم يجب أن يكون بين 1 و 5");

  await db.review.update({
    where: { id: reviewId },
    data: { rating, comment },
  });

  revalidatePath(`/courses/${review.course.slug}`);
  return success({ message: "تم تحديث التقييم." });
}

export async function hideReview(
  reviewId: string,
): Promise<ActionResult<{ message: string }>> {
  await requireRole(UserRole.ADMIN);

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return failure("التقييم غير موجود");

  await db.review.delete({ where: { id: reviewId } });

  revalidatePath("/admin/reviews");
  return success({ message: "تم إخفاء التقييم." });
}

export async function getAllReviews() {
  await requireRole(UserRole.ADMIN);

  return db.review.findMany({
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourseReviews(courseId: string) {
  return db.review.findMany({
    where: { courseId },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
}
