import { shouldUseSmtp } from "@/lib/email/smtp";
import { getPaymentProviderName } from "@/lib/payments";
import { isStripeEnabled } from "@/lib/payments/stripe-provider";
import { isStorageEnabled } from "@/lib/storage";

export type ServiceStatus = "ready" | "mock" | "missing";

export type InfrastructureStatus = {
  auth: { ready: boolean; issues: string[] };
  payments: { status: ServiceStatus; provider: string; issues: string[] };
  email: { status: ServiceStatus; issues: string[] };
  storage: { status: ServiceStatus; issues: string[] };
  site: { url: string | null; issues: string[] };
};

function isWeakSecret(value: string | undefined): boolean {
  if (!value) return true;
  if (value.length < 32) return true;
  return /change-me|your-password|example/i.test(value);
}

export function getInfrastructureStatus(): InfrastructureStatus {
  const authIssues: string[] = [];
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (isWeakSecret(secret)) {
    authIssues.push("AUTH_SECRET ضعيف أو غير مضبوط (32+ حرفاً عشوائياً)");
  }

  const paymentIssues: string[] = [];
  const provider = getPaymentProviderName();
  let paymentStatus: ServiceStatus = "mock";
  if (isStripeEnabled()) {
    paymentStatus = "ready";
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      paymentIssues.push("STRIPE_WEBHOOK_SECRET غير مضبوط — webhook لن يعمل");
      paymentStatus = "missing";
    }
  } else if (process.env.PAYMENT_PROVIDER === "stripe") {
    paymentStatus = "missing";
    paymentIssues.push("STRIPE_SECRET_KEY غير مضبوط");
  }

  const emailIssues: string[] = [];
  let emailStatus: ServiceStatus = "mock";
  if (process.env.EMAIL_MOCK === "true") {
    emailIssues.push("EMAIL_MOCK=true — البريد يُسجَّل في السجلات فقط");
  } else if (shouldUseSmtp()) {
    emailStatus = "ready";
  } else {
    emailStatus = "missing";
    emailIssues.push("SMTP غير مكتمل أو EMAIL_MOCK غير معطّل بدون SMTP");
  }

  const storageIssues: string[] = [];
  let storageStatus: ServiceStatus = "missing";
  if (isStorageEnabled()) {
    storageStatus = "ready";
    if (!process.env.S3_PUBLIC_URL) {
      storageIssues.push("S3_PUBLIC_URL غير مضبوط — قد لا تظهر الروابط للمستخدمين");
    }
  } else {
    storageIssues.push("رفع الملفات يدوياً فقط حتى ضبط S3/R2");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? null;
  const siteIssues: string[] = [];
  if (!siteUrl) {
    siteIssues.push("NEXT_PUBLIC_SITE_URL غير مضبوط");
  } else if (siteUrl.includes("localhost") && process.env.NODE_ENV === "production") {
    siteIssues.push("NEXT_PUBLIC_SITE_URL ما زال يشير إلى localhost في الإنتاج");
  }

  return {
    auth: { ready: authIssues.length === 0, issues: authIssues },
    payments: { status: paymentStatus, provider, issues: paymentIssues },
    email: { status: emailStatus, issues: emailIssues },
    storage: { status: storageStatus, issues: storageIssues },
    site: { url: siteUrl, issues: siteIssues },
  };
}

export function isProductionReady(status: InfrastructureStatus): boolean {
  return (
    status.auth.ready &&
    status.payments.status === "ready" &&
    status.email.status === "ready" &&
    status.site.issues.length === 0
  );
}
