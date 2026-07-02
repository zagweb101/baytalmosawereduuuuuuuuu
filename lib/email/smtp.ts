import nodemailer from "nodemailer";
import type { EmailPayload } from "@/lib/email/types";

const SEND_TIMEOUT_MS = 20_000;

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("SMTP timeout")), ms),
    ),
  ]);
}

export async function sendViaSmtp(payload: EmailPayload): Promise<void> {
  const transport = createTransport();
  const from =
    process.env.SMTP_FROM ??
    process.env.EMAIL_FROM ??
    "noreply@baytalmosawer.com";

  await withTimeout(
    transport.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? payload.html.replace(/<[^>]+>/g, ""),
    }),
    SEND_TIMEOUT_MS,
  );
}

export function shouldUseSmtp(): boolean {
  if (process.env.EMAIL_MOCK === "true") return false;
  return isSmtpConfigured();
}
