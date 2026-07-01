"use server";

import { DiscountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { failure, success, type ActionResult } from "@/lib/actions/types";
import { UserRole } from "@prisma/client";

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).default(0),
});

const couponSchema = z.object({
  code: z.string().min(3).max(50),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().min(0),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
});

const settingsSchema = z.object({
  siteName: z.string().min(2),
  commissionPercent: z.number().min(0).max(100),
  vatPercent: z.number().min(0).max(100),
  maxFreePreviewLessons: z.number().int().min(0),
  refundDays: z.number().int().min(0),
  refundMaxProgressPercent: z.number().int().min(0).max(100),
});

export async function getPlatformSettings() {
  await requireRole(UserRole.ADMIN);
  return db.platformSettings.findUnique({ where: { id: "default" } });
}

export async function updatePlatformSettings(
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  await requireRole(UserRole.ADMIN);

  const parsed = settingsSchema.safeParse({
    siteName: formData.get("siteName"),
    commissionPercent: Number(formData.get("commissionPercent")),
    vatPercent: Number(formData.get("vatPercent")),
    maxFreePreviewLessons: Number(formData.get("maxFreePreviewLessons")),
    refundDays: Number(formData.get("refundDays")),
    refundMaxProgressPercent: Number(formData.get("refundMaxProgressPercent")),
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  await db.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/admin/settings");
  return success({ message: "تم تحديث الإعدادات." });
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { order: "asc" } });
}

export async function createCategory(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole(UserRole.ADMIN);

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
    order: Number(formData.get("order") ?? 0),
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  const existing = await db.category.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) return failure("الرابط مستخدم بالفعل");

  const category = await db.category.create({ data: parsed.data });
  revalidatePath("/admin/categories");
  return success({ id: category.id });
}

export async function updateCategory(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  await requireRole(UserRole.ADMIN);

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
    order: Number(formData.get("order") ?? 0),
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  await db.category.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/categories");
  return success({ message: "تم تحديث التصنيف." });
}

export async function deleteCategory(
  id: string,
): Promise<ActionResult<{ message: string }>> {
  await requireRole(UserRole.ADMIN);

  const coursesCount = await db.course.count({ where: { categoryId: id } });
  if (coursesCount > 0) {
    return failure("لا يمكن حذف تصنيف يحتوي على دورات");
  }

  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return success({ message: "تم حذف التصنيف." });
}

export async function getCoupons() {
  await requireRole(UserRole.ADMIN);
  return db.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createCoupon(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireRole(UserRole.ADMIN);

  const parsed = couponSchema.safeParse({
    code: String(formData.get("code")).toUpperCase(),
    discountType: formData.get("discountType") as DiscountType,
    discountValue: Number(formData.get("discountValue")),
    maxUses: formData.get("maxUses") ? Number(formData.get("maxUses")) : undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  const existing = await db.coupon.findUnique({
    where: { code: parsed.data.code },
  });
  if (existing) return failure("الكود مستخدم بالفعل");

  const coupon = await db.coupon.create({
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : null,
    },
  });

  revalidatePath("/admin/coupons");
  return success({ id: coupon.id });
}

export async function updateCoupon(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  await requireRole(UserRole.ADMIN);

  const parsed = couponSchema.safeParse({
    code: String(formData.get("code")).toUpperCase(),
    discountType: formData.get("discountType") as DiscountType,
    discountValue: Number(formData.get("discountValue")),
    maxUses: formData.get("maxUses") ? Number(formData.get("maxUses")) : undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) return failure("بيانات غير صالحة");

  await db.coupon.update({
    where: { id },
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : null,
    },
  });

  revalidatePath("/admin/coupons");
  return success({ message: "تم تحديث الكوبون." });
}

export async function deleteCoupon(
  id: string,
): Promise<ActionResult<{ message: string }>> {
  await requireRole(UserRole.ADMIN);

  await db.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
  return success({ message: "تم حذف الكوبون." });
}
