"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { getProgress } from "@/lib/actions/enrollments";
import { hasPassedQuiz } from "@/lib/actions/quizzes";
import { checkVerifyRateLimit } from "@/lib/certificates/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { failure, success, type ActionResult } from "@/lib/actions/types";

function generateCertificateNumber(): string {
  return `BM-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function issueCertificate(
  courseId: string,
): Promise<ActionResult<{ certificateNumber: string }>> {
  const user = await requireAuth();

  const progress = await getProgress(courseId);
  if (!progress) return failure("يجب التسجيل في الدورة أولاً");

  if (progress.percent < 100) {
    return failure("يجب إكمال جميع الدروس للحصول على الشهادة");
  }

  const quizPassed = await hasPassedQuiz(user.id, courseId);
  if (!quizPassed) {
    return failure("يجب اجتياز الاختبار للحصول على الشهادة");
  }

  const existing = await db.certificate.findFirst({
    where: { userId: user.id, courseId },
  });

  if (existing) {
    return success({ certificateNumber: existing.certificateNumber });
  }

  const certificate = await db.certificate.create({
    data: {
      certificateNumber: generateCertificateNumber(),
      userId: user.id,
      courseId,
      enrollmentId: progress.enrollment.id,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "CERTIFICATE_ISSUED",
    entityType: "Certificate",
    entityId: certificate.id,
  });

  revalidatePath("/dashboard/certificates");
  return success({ certificateNumber: certificate.certificateNumber });
}

export async function verifyCertificate(
  certificateNumber: string,
): Promise<
  ActionResult<{
    valid: boolean;
    studentName?: string;
    courseTitle?: string;
    issuedAt?: Date;
  }>
> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown";

  if (!checkVerifyRateLimit(ip)) {
    return failure("تجاوزت عدد المحاولات المسموحة. حاول لاحقاً.");
  }

  if (!certificateNumber.trim()) {
    return failure("رقم الشهادة مطلوب");
  }

  const certificate = await db.certificate.findUnique({
    where: { certificateNumber: certificateNumber.trim() },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });

  if (!certificate) {
    return success({ valid: false });
  }

  return success({
    valid: true,
    studentName: certificate.user.name,
    courseTitle: certificate.course.title,
    issuedAt: certificate.issuedAt,
  });
}

export async function getMyCertificates() {
  const user = await requireAuth();

  return db.certificate.findMany({
    where: { userId: user.id },
    include: {
      course: { select: { title: true, slug: true, thumbnail: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
}
