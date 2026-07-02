import { redirect } from "next/navigation";
import type { UserRole, UserStatus } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

const BLOCKED_STATUSES: UserStatus[] = ["SUSPENDED", "PENDING_VERIFICATION"];

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  if (session.user.error === "SessionRevoked") {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      bio: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      sessionVersion: true,
    },
  });

  if (!user) {
    return null;
  }

  const tokenVersion = session.user.sessionVersion;
  if (
    tokenVersion !== undefined &&
    user.sessionVersion !== tokenVersion
  ) {
    return null;
  }

  if (session.sessionId) {
    const activeSession = await db.userSession.findUnique({
      where: { id: session.sessionId },
      select: { userId: true },
    });
    if (!activeSession || activeSession.userId !== user.id) {
      return null;
    }
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (BLOCKED_STATUSES.includes(user.status)) {
    redirect("/login?error=account_blocked");
  }
  if (user.status === "PENDING" && user.role === "INSTRUCTOR") {
    redirect("/login?error=pending_instructor");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  const user = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    redirect("/");
  }

  return user;
}
