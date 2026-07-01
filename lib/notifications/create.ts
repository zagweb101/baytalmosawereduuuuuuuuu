import type { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";

type CreateNotificationInput = {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  link?: string;
};

export async function createNotification({
  userId,
  title,
  body,
  type = "INFO",
  link,
}: CreateNotificationInput) {
  return db.notification.create({
    data: { userId, title, body, type, link },
  });
}
