import type { EmailPayload } from "@/lib/email/types";
import { sendViaSmtp, shouldUseSmtp } from "@/lib/email/smtp";

export type { EmailPayload } from "@/lib/email/types";

const siteName = () =>
  process.env.NEXT_PUBLIC_PLATFORM_NAME ?? "بيت المصور";

function rtlHtml(body: string): string {
  return `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6">${body}</div>`;
}

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
    subject: `مرحباً بك في ${siteName()}`,
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>شكراً لتسجيلك في منصة ${siteName()} التعليمية. يمكنك الآن تصفح الدورات والبدء بالتعلم.</p>`,
    ),
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
    subject: `تفعيل حسابك - ${siteName()}`,
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>اضغط على الرابط التالي لتفعيل حسابك:</p><p><a href="${siteUrl}/verify-email?token=${token}">تفعيل الحساب</a></p>`,
    ),
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
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>تم تسجيلك بنجاح في دورة «${courseTitle}».</p>`,
    ),
  });
}

export async function sendPaymentSuccessEmail(
  to: string,
  name: string,
  courseTitle: string,
  amount: number,
): Promise<void> {
  await sendEmail({
    to,
    subject: `تم الدفع بنجاح - ${courseTitle}`,
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>تم تأكيد دفعك بمبلغ <strong>${amount.toFixed(2)} ر.س</strong> لدورة «${courseTitle}».</p><p>يمكنك البدء بالتعلم الآن من لوحة التحكم.</p>`,
    ),
  });
}

export async function sendPaymentFailedEmail(
  to: string,
  name: string,
  courseTitle: string,
  reason?: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: `فشل الدفع - ${courseTitle}`,
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>لم يتم إتمام عملية الدفع لدورة «${courseTitle}».${reason ? ` السبب: ${reason}` : ""}</p><p>يمكنك المحاولة مرة أخرى من صفحة الطلبات.</p>`,
    ),
  });
}

export async function sendCourseApprovedEmail(
  to: string,
  name: string,
  courseTitle: string,
  courseSlug: string,
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendEmail({
    to,
    subject: `تم قبول دورتك: ${courseTitle}`,
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>تمت الموافقة على نشر دورتك «${courseTitle}».</p><p><a href="${siteUrl}/courses/${courseSlug}">عرض الدورة</a></p>`,
    ),
  });
}

export async function sendCourseRejectedEmail(
  to: string,
  name: string,
  courseTitle: string,
  reason: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: `تم رفض دورتك: ${courseTitle}`,
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>لم تُقبل دورتك «${courseTitle}» للنشر.</p><p><strong>السبب:</strong> ${reason}</p><p>يمكنك تعديل الدورة وإعادة إرسالها للمراجعة.</p>`,
    ),
  });
}

export async function sendCertificateIssuedEmail(
  to: string,
  name: string,
  courseTitle: string,
  certificateNumber: string,
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendEmail({
    to,
    subject: `شهادتك جاهزة - ${courseTitle}`,
    html: rtlHtml(
      `<p>مبروك ${name}!</p><p>حصلت على شهادة إتمام دورة «${courseTitle}».</p><p>رقم الشهادة: <strong>${certificateNumber}</strong></p><p><a href="${siteUrl}/dashboard/certificates">عرض شهاداتي</a></p>`,
    ),
  });
}

export async function sendInstructorApprovedEmail(
  to: string,
  name: string,
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendEmail({
    to,
    subject: `تمت الموافقة على طلب المدرب - ${siteName()}`,
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>تمت الموافقة على طلبك كمدرب. يمكنك الآن إنشاء وإدارة الدورات.</p><p><a href="${siteUrl}/instructor">لوحة المدرب</a></p>`,
    ),
  });
}

export async function sendRefundEmail(
  to: string,
  name: string,
  courseTitle: string,
  amount: number,
): Promise<void> {
  await sendEmail({
    to,
    subject: `تم استرداد المبلغ - ${courseTitle}`,
    html: rtlHtml(
      `<p>مرحباً ${name}،</p><p>تم استرداد مبلغ <strong>${amount.toFixed(2)} ر.س</strong> لطلب دورة «${courseTitle}».</p>`,
    ),
  });
}
