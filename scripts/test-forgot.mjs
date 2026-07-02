import { chromium } from "playwright";

const base =
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://baytalmosawereduuuuuuuuu-production.up.railway.app";

const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];

page.on("response", async (r) => {
  if (r.request().method() === "POST") {
    const body = await r.text().catch(() => "");
    logs.push(`POST ${r.status()} ${r.url().slice(-60)} | ${body.slice(0, 300)}`);
  }
});

await page.goto(`${base}/forgot-password`, { waitUntil: "networkidle", timeout: 60000 });
await page.fill("#email", "student@baytalmosawer.com");
const t0 = Date.now();
await page.getByRole("button", { name: "إرسال رابط إعادة التعيين" }).click();

for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(1000);
  const green = await page.locator(".border-green-200").textContent().catch(() => "");
  const red = await page.locator(".border-red-200").textContent().catch(() => "");
  if (green || red) {
    logs.push(`OK green=${green} red=${red} elapsed=${Date.now() - t0}ms`);
    break;
  }
}
if (!logs.some((l) => l.startsWith("OK"))) {
  logs.push(`TIMEOUT elapsed=${Date.now() - t0}ms`);
}

await browser.close();
console.log(logs.join("\n"));
