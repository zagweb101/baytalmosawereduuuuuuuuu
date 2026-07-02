import type { EmailPayload } from "@/lib/email/types";

export async function sendViaBrevoApi(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY غير مضبوط");
  }

  const fromEmail =
    process.env.SMTP_FROM ??
    process.env.EMAIL_FROM ??
    "noreply@baytalmosawer.com";
  const fromName = process.env.NEXT_PUBLIC_PLATFORM_NAME ?? "بيت المصور";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo API ${res.status}: ${detail.slice(0, 200)}`);
  }
}

export function shouldUseBrevoApi(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim());
}
