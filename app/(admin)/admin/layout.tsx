import { Header } from "@/components/shared/header";
import { DashboardSidebar, type SidebarItem } from "@/components/shared/dashboard-sidebar";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const adminNav: SidebarItem[] = [
  { href: "/admin", label: "لوحة التحكم", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "المستخدمون", icon: "Users" },
  { href: "/admin/enrollments", label: "التسجيلات", icon: "ClipboardList" },
  { href: "/admin/instructors", label: "المدربون", icon: "GraduationCap" },
  { href: "/admin/courses", label: "الدورات", icon: "BookOpen" },
  { href: "/admin/courses/review", label: "المراجعة", icon: "ClipboardList" },
  { href: "/admin/orders", label: "الطلبات", icon: "ShoppingBag" },
  { href: "/admin/categories", label: "التصنيفات", icon: "FolderOpen" },
  { href: "/admin/coupons", label: "الكوبونات", icon: "Ticket" },
  { href: "/admin/reviews", label: "التقييمات", icon: "Star" },
  { href: "/admin/audit-logs", label: "سجل التدقيق", icon: "FileText" },
  { href: "/admin/settings", label: "الإعدادات", icon: "Settings" },
  { href: "/admin/reports", label: "التقارير", icon: "BarChart3" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRole.ADMIN);

  return (
    <>
      <Header />
      <div className="flex flex-1">
        <DashboardSidebar
          items={adminNav}
          title="لوحة الإدارة"
          homeHref="/admin"
          mobileMaxItems={4}
        />
        <main id="main-content" className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    </>
  );
}
