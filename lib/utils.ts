import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** يحوّل Float أو Decimal من Prisma إلى number */
export function toNumber(amount: number | { toNumber(): number }): number {
  return typeof amount === "number" ? amount : amount.toNumber();
}

export function formatPrice(amount: number | { toNumber(): number }): string {
  const value = toNumber(amount);
  if (value === 0) return "مجاني";
  return `${value.toFixed(2)} ر.س`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (base) return base;
  return `item-${Date.now()}`;
}
