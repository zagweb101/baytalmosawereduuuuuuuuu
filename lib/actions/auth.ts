"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { UserRole, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation/schemas";
import { createAuditLog } from "@/lib/audit";
import {
  sendVerificationEmail,
  sendEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import {
  createVerificationToken,
  createPasswordResetToken,
  consumeToken,
} from "@/lib/auth/verification-tokens";
import { requireAuth } from "@/lib/auth/session";
import { invalidateUserSessions } from "@/lib/auth/session-invalidation";
import { checkRateLimitAsync } from "@/lib/rate-limit";
import { failure, success, type ActionResult } from "@/lib/actions/types";

export async function registerStudent(
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: "STUDENT" as const,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimitAsync(`register:${ip}`, 5, 60 * 60 * 1000))) {
    return failure("تجاوزت عدد محاولات التسجيل. حاول لاحقاً.");
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return failure("البريد الإلكتروني مستخدم بالفعل");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.PENDING_VERIFICATION,
    },
  });

  const token = await createVerificationToken(user.id);
  try {
    await sendVerificationEmail(normalizedEmail, name, token);
  } catch (err) {
    console.error("[registerStudent] verification email failed:", err);
  }

  await createAuditLog({
    userId: user.id,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user.id,
  });

  return success({
    message: "تم إنشاء الحساب. يرجى التحقق من بريدك الإلكتروني.",
  });
}

export async function verifyEmail(
  token: string,
): Promise<ActionResult<{ message: string }>> {
  if (!token) {
    return failure("رمز التحقق مطلوب");
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimitAsync(`verify-email:${ip}`, 10, 15 * 60 * 1000))) {
    return failure("تجاوزت عدد المحاولات. حاول لاحقاً.");
  }

  const userId = await consumeToken(token, "verify");
  if (!userId) {
    return failure("رمز التحقق غير صالح أو منتهي الصلاحية");
  }

  await db.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  await createAuditLog({
    userId,
    action: "EMAIL_VERIFIED",
    entityType: "User",
    entityId: userId,
  });

  const verifiedUser = await db.user.findUnique({ where: { id: userId } });
  if (verifiedUser) {
    await sendWelcomeEmail(verifiedUser.email, verifiedUser.name);
  }

  return success({ message: "تم تفعيل حسابك بنجاح. يمكنك تسجيل الدخول الآن." });
}

export async function becomeInstructor(
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  if (user.role !== UserRole.STUDENT) {
    return failure("أنت مسجل بالفعل كمدرب أو مدير");
  }

  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length < 20) {
    return failure("يرجى كتابة نبذة عن خبرتك (20 حرفاً على الأقل)");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      bio,
      role: UserRole.INSTRUCTOR,
      status: UserStatus.PENDING,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "INSTRUCTOR_APPLICATION",
    entityType: "User",
    entityId: user.id,
  });

  return success({
    message: "تم إرسال طلبك. سيتم مراجعته من قبل الإدارة.",
  });
}

export async function forgotPassword(
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();

  if (!email) {
    return failure("البريد الإلكتروني مطلوب");
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimitAsync(`forgot-password:${ip}`, 5, 60 * 60 * 1000))) {
    return failure("تجاوزت عدد المحاولات. حاول لاحقاً.");
  }

  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    const token = await createPasswordResetToken(user.id);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    try {
      await sendEmail({
        to: email,
        subject: "إعادة تعيين كلمة المرور - بيت المصور",
        html: `<p>مرحباً ${user.name}،</p><p>اضغط على الرابط لإعادة تعيين كلمة المرور:</p><p><a href="${siteUrl}/forgot-password?token=${token}">إعادة التعيين</a></p>`,
      });
    } catch (err) {
      console.error("[forgotPassword] reset email failed:", err);
    }
  }

  return success({
    message: "إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور.",
  });
}

export async function resetPassword(
  token: string,
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return failure("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }
  if (password !== confirm) {
    return failure("كلمتا المرور غير متطابقتين");
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimitAsync(`reset-password:${ip}`, 10, 60 * 60 * 1000))) {
    return failure("تجاوزت عدد المحاولات. حاول لاحقاً.");
  }

  const userId = await consumeToken(token, "reset");
  if (!userId) {
    return failure("رمز إعادة التعيين غير صالح أو منتهي");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await invalidateUserSessions(userId);

  return success({ message: "تم تغيير كلمة المرور بنجاح." });
}

export async function updateProfile(
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim() || null;

  if (name.length < 2) {
    return failure("الاسم يجب أن يكون حرفين على الأقل");
  }

  await db.user.update({
    where: { id: user.id },
    data: { name, bio },
  });

  return success({ message: "تم تحديث الملف الشخصي." });
}
