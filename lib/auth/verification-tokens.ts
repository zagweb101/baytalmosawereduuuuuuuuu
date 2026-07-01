import { randomUUID } from "crypto";
import { TokenType } from "@prisma/client";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createVerificationToken(userId: string): Promise<string> {
  const token = randomUUID();
  await db.verificationToken.create({
    data: {
      token,
      userId,
      type: TokenType.VERIFY,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomUUID();
  await db.verificationToken.create({
    data: {
      token,
      userId,
      type: TokenType.RESET,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function consumeToken(
  token: string,
  type: "verify" | "reset",
): Promise<string | null> {
  const tokenType = type === "verify" ? TokenType.VERIFY : TokenType.RESET;

  const entry = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!entry || entry.type !== tokenType || entry.expiresAt < new Date()) {
    if (entry) {
      await db.verificationToken.delete({ where: { id: entry.id } }).catch(() => {});
    }
    return null;
  }

  await db.verificationToken.delete({ where: { id: entry.id } });
  return entry.userId;
}

/** يحذف الرموز المنتهية (يُستدعى دورياً اختيارياً) */
export async function purgeExpiredTokens(): Promise<number> {
  const result = await db.verificationToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
