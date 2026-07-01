import { test, expect } from "@playwright/test";

test.describe("الصفحات العامة", () => {
  test("الصفحة الرئيسية تعرض اسم المنصة", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("بيت المصور").first()).toBeVisible();
  });

  test("صفحة الدورات تعمل", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("صفحة تسجيل الدخول", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
    await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible();
  });
});

test.describe("تسجيل الدخول", () => {
  test("دخول الطالب التجريبي", async ({ page }) => {
    test.skip(Boolean(process.env.CI), "اختبار الجلسة يُشغَّل محلياً — CI يتحقق من الصفحات العامة");
    await page.goto("/login");
    await page.getByRole("textbox", { name: "البريد الإلكتروني" }).fill("student@baytalmosawer.com");
    await page.getByLabel("كلمة المرور").fill("Student123!");
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("مرحباً");
  });
});
