import { Header } from "@/components/shared/header";
import { DashboardSidebar, type SidebarItem } from "@/components/shared/dashboard-sidebar";
import { requireAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const studentNav: SidebarItem[] = [
  { href: "/dashboard", label: "نظرة عامة", icon: "LayoutDashboard" },
  { href: "/dashboard/my-courses", label: "دوراتي", icon: "BookOpen" },
  { href: "/dashboard/certificates", label: "شهاداتي", icon: "Award" },
  { href: "/dashboard/orders", label: "طلباتي", icon: "ShoppingBag" },
  { href: "/dashboard/profile", label: "الملف الشخصي", icon: "User" },
];

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <>
      <Header />
      <div className="flex flex-1">
        <DashboardSidebar items={studentNav} title="لوحة الطالب" />
        <div className="flex-1 pb-20 lg:pb-0">{children}</div>
      </div>
    </>
  );
}
