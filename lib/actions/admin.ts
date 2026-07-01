"use server";

import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { invalidateUserSessions } from "@/lib/auth/session-invalidation";
import { sendInstructorApprovedEmail } from "@/lib/email";
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
  const instructor = await db.user.findUnique({ where: { id: userId } });
  if (instructor) {
    await sendInstructorApprovedEmail(instructor.email, instructor.name);
  }
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

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
});

export async function createUser(
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase(),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return failure("البريد الإلكتروني مستخدم بالفعل");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  await createAuditLog({
    userId: admin.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { role },
  });

  revalidatePath("/admin/users");
  return success({ message: "تم إنشاء المستخدم." });
}

export async function changeUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResult<{ message: string }>> {
  const admin = await requireRole(UserRole.ADMIN);

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return failure("المستخدم غير موجود");
  if (target.id === admin.id) return failure("لا يمكن تغيير دورك");
  if (target.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
    const adminCount = await db.user.count({ where: { role: UserRole.ADMIN } });
    if (adminCount <= 1) {
      return failure("يجب أن يبقى مدير واحد على الأقل");
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  await invalidateUserSessions(userId);

  await createAuditLog({
    userId: admin.id,
    action: "USER_ROLE_CHANGED",
    entityType: "User",
    entityId: userId,
    metadata: { from: target.role, to: role },
  });

  revalidatePath("/admin/users");
  return success({ message: "تم تحديث الدور." });
}
