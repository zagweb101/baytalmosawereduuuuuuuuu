"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { failure, success, type ActionResult } from "@/lib/actions/types";

export async function getMyNotifications(limit = 20) {
  const user = await requireAuth();

  return db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount() {
  const user = await requireAuth();

  return db.notification.count({
    where: { userId: user.id, isRead: false },
  });
}

export async function markNotificationRead(
  notificationId: string,
): Promise<ActionResult<{ message: string }>> {
  const user = await requireAuth();

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== user.id) {
    return failure("الإشعار غير موجود");
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/dashboard");
  return success({ message: "تم التعليم كمقروء" });
}

export async function markAllNotificationsRead(): Promise<
  ActionResult<{ message: string }>
> {
  const user = await requireAuth();

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/dashboard");
  return success({ message: "تم تعليم الكل كمقروء" });
}
