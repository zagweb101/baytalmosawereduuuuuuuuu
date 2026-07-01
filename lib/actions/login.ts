"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { trackUserSession } from "@/lib/sessions/track";

const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateKey = `login:${ip}:${email.toLowerCase()}`;

  if (!checkRateLimit(rateKey, LOGIN_MAX, LOGIN_WINDOW_MS)) {
    return {
      success: false,
      error: "تجاوزت عدد محاولات الدخول. حاول بعد 15 دقيقة.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    resetRateLimit(rateKey);
    await trackUserSession();
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    throw error;
  }
}
