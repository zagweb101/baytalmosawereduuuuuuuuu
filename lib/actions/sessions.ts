"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { failure, success, type ActionResult } from "@/lib/actions/types";

export async function getMySessions() {
  const user = await requireAuth();

  return db.userSession.findMany({
    where: { userId: user.id },
    orderBy: { lastActiveAt: "desc" },
    take: 20,
  });
}

export async function revokeSession(
  sessionId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const session = await db.userSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== user.id) {
    return failure("الجلسة غير موجودة");
  }

  await db.userSession.delete({ where: { id: sessionId } });
  revalidatePath("/dashboard/profile");
  return success({ message: "تم إنهاء الجلسة." });
}

export async function revokeOtherSessions(): Promise<
  ActionResult<{ message: string; count: number }>
> {
  const user = await requireAuth();

  const latest = await db.userSession.findFirst({
    where: { userId: user.id },
    orderBy: { lastActiveAt: "desc" },
  });

  if (!latest) {
    return success({ message: "لا توجد جلسات أخرى.", count: 0 });
  }

  const result = await db.userSession.deleteMany({
    where: {
      userId: user.id,
      id: { not: latest.id },
    },
  });

  revalidatePath("/dashboard/profile");
  return success({
    message: `تم إنهاء ${result.count} جلسة.`,
    count: result.count,
  });
}
