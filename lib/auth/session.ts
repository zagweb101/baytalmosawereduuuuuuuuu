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
    },
  });

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
