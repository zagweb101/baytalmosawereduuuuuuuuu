import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return "غير معروف";
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "جوال";
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "جهاز لوحي";
  }
  return "حاسوب";
}

export async function trackUserSession(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headersList.get("user-agent");

  const recent = await db.userSession.findFirst({
    where: {
      userId: session.user.id,
      ipAddress: ip,
      userAgent: userAgent ?? undefined,
      lastActiveAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
    orderBy: { lastActiveAt: "desc" },
  });

  if (recent) {
    await db.userSession.update({
      where: { id: recent.id },
      data: { lastActiveAt: new Date() },
    });
    return;
  }

  await db.userSession.create({
    data: {
      userId: session.user.id,
      ipAddress: ip,
      userAgent: userAgent ?? undefined,
      deviceType: parseDeviceType(userAgent),
    },
  });
}

export async function touchUserSession(userId: string): Promise<void> {
  const latest = await db.userSession.findFirst({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
  });

  if (latest) {
    await db.userSession.update({
      where: { id: latest.id },
      data: { lastActiveAt: new Date() },
    });
  }
}
