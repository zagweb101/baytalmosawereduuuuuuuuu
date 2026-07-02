import { chromium } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL ??
  "https://baytalmosawereduuuuuuuuu-production.up.railway.app";

const results = [];

function log(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function waitForMessage(page, timeout = 30_000) {
  const green = page.locator("p.text-green-600");
  const red = page.locator("p.text-red-500");
  await Promise.race([
    green.waitFor({ state: "visible", timeout }).then(() => ({ type: "ok", text: green })),
    red.waitFor({ state: "visible", timeout }).then(() => ({ type: "err", text: red })),
  ]).catch(() => null);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: "ar-SA" });

  // Health
  const healthRes = await page.request.get(`${BASE}/api/health`);
  const health = await healthRes.json();
  log("Health API", healthRes.ok() && health.status === "ok", JSON.stringify(health));

  // Login — seed student
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "student@baytalmosawer.com");
  await page.fill("#password", "Student123!");
  await page.getByRole("main").getByRole("button", { name: "دخول" }).click();
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    const heading = await page.getByRole("heading", { level: 1 }).textContent();
    log("تسجيل دخول الطالب", /مرحباً/.test(heading ?? ""), heading?.trim());
  } catch {
    const err = await page.locator("p.text-red-500").textContent().catch(() => "");
    log("تسجيل دخول الطالب", false, err || page.url());
  }

  // Logout via clearing session — visit login for next tests
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });

  // Register — new account
  const uniqueEmail = `test.${Date.now()}@baytalmosawer.com`;
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.fill("#name", "مختبر النظام");
  await page.fill("#email", uniqueEmail);
  await page.fill("#password", "TestPass1!");
  await page.getByRole("main").getByRole("button", { name: "تسجيل" }).click();
  const regMsg = await waitForMessage(page);
  if (regMsg?.type === "ok") {
    const text = await regMsg.text.textContent();
    log("إنشاء حساب جديد", /تم إنشاء الحساب/.test(text ?? ""), `${uniqueEmail} — ${text?.trim()}`);
  } else if (regMsg?.type === "err") {
    const text = await regMsg.text.textContent();
    log("إنشاء حساب جديد", false, text?.trim());
  } else {
    log("إنشاء حساب جديد", false, "لا رسالة نجاح/خطأ");
  }

  // Forgot password
  await page.goto(`${BASE}/forgot-password`, { waitUntil: "networkidle" });
  await page.fill("#email", "student@baytalmosawer.com");
  await page.getByRole("main").getByRole("button", { name: "إرسال رابط إعادة التعيين" }).click();
  const forgotMsg = await waitForMessage(page);
  if (forgotMsg?.type === "ok") {
    const text = await forgotMsg.text.textContent();
    log("نسيت كلمة المرور", /ستصلك|مسجلاً/.test(text ?? ""), text?.trim());
  } else if (forgotMsg?.type === "err") {
    const text = await forgotMsg.text.textContent();
    log("نسيت كلمة المرور", false, text?.trim());
  } else {
    log("نسيت كلمة المرور", false, "لا رسالة نجاح/خطأ");
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log("\n--- ملخص ---");
  console.log(`نجح: ${results.length - failed.length}/${results.length}`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error("فشل التشغيل:", e.message);
  process.exit(1);
});
