import type { CourseStatus, OrderStatus, UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const courseStatusLabels: Record<CourseStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "outline" }> = {
  DRAFT: { label: "مسودة", variant: "outline" },
  UNDER_REVIEW: { label: "قيد المراجعة", variant: "warning" },
  PUBLISHED: { label: "منشورة", variant: "success" },
  REJECTED: { label: "مرفوضة", variant: "danger" },
  ARCHIVED: { label: "مؤرشفة", variant: "outline" },
};

const orderStatusLabels: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "outline" }> = {
  PENDING: { label: "قيد الانتظار", variant: "warning" },
  PAID: { label: "مدفوع", variant: "success" },
  FAILED: { label: "فشل", variant: "danger" },
  REFUNDED: { label: "مسترد", variant: "outline" },
  CANCELLED: { label: "ملغي", variant: "outline" },
};

const userStatusLabels: Record<UserStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "outline" }> = {
  PENDING_VERIFICATION: { label: "بانتظار التفعيل", variant: "warning" },
  ACTIVE: { label: "نشط", variant: "success" },
  SUSPENDED: { label: "معلق", variant: "danger" },
  PENDING: { label: "بانتظار الموافقة", variant: "warning" },
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const { label, variant } = courseStatusLabels[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = orderStatusLabels[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { label, variant } = userStatusLabels[status];
  return <Badge variant={variant}>{label}</Badge>;
}
