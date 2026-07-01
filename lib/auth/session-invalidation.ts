import { db } from "@/lib/db";

/** يُبطل كل جلسات JWT للمستخدم (تعليق، تغيير كلمة مرور، إلخ) */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    }),
    db.userSession.deleteMany({ where: { userId } }),
  ]);
}
