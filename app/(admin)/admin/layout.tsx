import { Header } from "@/components/shared/header";
import { DashboardSidebar, type SidebarItem } from "@/components/shared/dashboard-sidebar";

export const dynamic = "force-dynamic";

const adminNav: SidebarItem[] = [
  { href: "/admin", label: "لوحة التحكم", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "المستخدمون", icon: "Users" },
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex flex-1">
        <DashboardSidebar
          items={adminNav}
          title="لوحة الإدارة"
          homeHref="/admin"
        />
        <div className="flex-1 pb-20 lg:pb-0">{children}</div>
      </div>
    </>
  );
}
