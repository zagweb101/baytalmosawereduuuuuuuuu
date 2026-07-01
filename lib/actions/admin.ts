"use server";

import { UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { invalidateUserSessions } from "@/lib/auth/session-invalidation";
import { failure, success, type ActionResult } from "@/lib/actions/types";

export async function manageUsers(filters?: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}) {
  await requireRole(UserRole.ADMIN);

  const where: {
    role?: UserRole;
    status?: UserStatus;
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }>;
  } = {};

  if (filters?.role) where.role = filters.role;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { courses: true, enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function suspendUser(
  userId: string,
): Promise<ActionResult<{ message: string }>> {
  const admin = await requireRole(UserRole.ADMIN);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return failure("المستخدم غير موجود");
  if (user.role === UserRole.ADMIN) return failure("لا يمكن تعليق مدير");

  await db.user.update({
    where: { id: userId },
    data: { status: UserStatus.SUSPENDED },
  });

  await invalidateUserSessions(userId);

  await createAuditLog({
    userId: admin.id,
    action: "USER_SUSPENDED",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/users");
  return success({ message: "تم تعليق المستخدم." });
}

export async function activateUser(
  userId: string,
): Promise<ActionResult<{ message: string }>> {
  const admin = await requireRole(UserRole.ADMIN);

  await db.user.update({
    where: { id: userId },
    data: { status: UserStatus.ACTIVE },
  });

  await createAuditLog({
    userId: admin.id,
    action: "USER_ACTIVATED",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/users");
  return success({ message: "تم تفعيل المستخدم." });
}

export async function approveInstructor(
  userId: string,
): Promise<ActionResult<{ message: string }>> {
  const admin = await requireRole(UserRole.ADMIN);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== UserStatus.PENDING) {
    return failure("المستخدم غير متاح للموافقة");
  }

  await db.user.update({
    where: { id: userId },
    data: { status: UserStatus.ACTIVE, role: UserRole.INSTRUCTOR },
  });

  await createAuditLog({
    userId: admin.id,
    action: "INSTRUCTOR_APPROVED",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/instructors");
  return success({ message: "تمت الموافقة على المدرب." });
}

export async function getPendingInstructors() {
  await requireRole(UserRole.ADMIN);

  return db.user.findMany({
    where: { status: UserStatus.PENDING, role: UserRole.INSTRUCTOR },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAuditLogs(limit = 50) {
  await requireRole(UserRole.ADMIN);

  return db.auditLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
