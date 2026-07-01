import { Header } from "@/components/shared/header";
import { DashboardSidebar, type SidebarItem } from "@/components/shared/dashboard-sidebar";

export const dynamic = "force-dynamic";

const instructorNav: SidebarItem[] = [
  { href: "/instructor", label: "نظرة عامة", icon: "LayoutDashboard" },
  { href: "/instructor/courses", label: "دوراتي", icon: "BookOpen" },
  { href: "/instructor/courses/new", label: "دورة جديدة", icon: "Plus" },
  { href: "/instructor/students", label: "الطلاب", icon: "Users" },
];

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex flex-1">
        <DashboardSidebar
          items={instructorNav}
          title="لوحة المدرب"
          homeHref="/instructor"
        />
        <div className="flex-1 pb-20 lg:pb-0">{children}</div>
      </div>
    </>
  );
}
