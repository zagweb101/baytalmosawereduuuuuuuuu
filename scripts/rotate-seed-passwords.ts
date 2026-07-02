/**
 * تدوير كلمات مرور حسابات البذور على الإنتاج (مرة واحدة بعد النشر).
 *
 * الاستخدام على Railway Shell:
 *   CONFIRM_ROTATE=1 npx tsx scripts/rotate-seed-passwords.ts
 */
import "dotenv/config";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";

const SEED_EMAILS = [
  "admin@baytalmosawer.com",
  "instructor@baytalmosawer.com",
  "student@baytalmosawer.com",
] as const;

function generatePassword(): string {
  const core = randomBytes(14).toString("base64url").replace(/[^a-zA-Z0-9]/g, "");
  return `${core.slice(0, 12)}!Aa1`;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.CONFIRM_ROTATE !== "1") {
    console.error(
      "للتشغيل على الإنتاج: CONFIRM_ROTATE=1 npx tsx scripts/rotate-seed-passwords.ts",
    );
    process.exit(1);
  }

  console.log("تدوير كلمات مرور حسابات البذور...\n");

  for (const email of SEED_EMAILS) {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`[تخطّي] ${email} — غير موجود`);
      continue;
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { email },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });

    console.log(`${email}\n  ${password}\n`);
  }

  console.log("تم. احفظ كلمات المرور في مدير كلمات المرور واحذف هذا السجل.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
