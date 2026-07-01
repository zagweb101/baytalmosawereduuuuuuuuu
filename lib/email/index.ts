import type { EmailPayload } from "@/lib/email/types";
import { sendViaSmtp, shouldUseSmtp } from "@/lib/email/smtp";

export type { EmailPayload } from "@/lib/email/types";

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (shouldUseSmtp()) {
    await sendViaSmtp(payload);
    return;
  }

  console.log("[EMAIL MOCK]", {
    to: payload.to,
    subject: payload.subject,
    text: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
  });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "مرحباً بك في بيت المصور",
    html: `<p>مرحباً ${name}،</p><p>شكراً لتسجيلك في منصة بيت المصور التعليمية.</p>`,
  });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendEmail({
    to,
    subject: "تفعيل حسابك - بيت المصور",
    html: `<p>مرحباً ${name}،</p><p>اضغط على الرابط التالي لتفعيل حسابك:</p><p><a href="${siteUrl}/verify-email?token=${token}">تفعيل الحساب</a></p>`,
  });
}

export async function sendEnrollmentEmail(
  to: string,
  name: string,
  courseTitle: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: `تم التسجيل في دورة: ${courseTitle}`,
    html: `<p>مرحباً ${name}،</p><p>تم تسجيلك بنجاح في دورة "${courseTitle}".</p>`,
  });
}
