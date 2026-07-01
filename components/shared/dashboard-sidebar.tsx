"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Settings,
  ShoppingBag,
  Star,
  Ticket,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  ShoppingBag,
  FolderOpen,
  Ticket,
  Star,
  FileText,
  Settings,
  BarChart3,
  Award,
  User,
  Plus,
} as const satisfies Record<string, LucideIcon>;

export type SidebarIconName = keyof typeof ICON_MAP;

export type SidebarItem = {
  href: string;
  label: string;
  icon: SidebarIconName;
};

type DashboardSidebarProps = {
  items: SidebarItem[];
  title: string;
  homeHref?: string;
};

export function DashboardSidebar({
  items,
  title,
  homeHref = "/dashboard",
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col border-e border-border bg-card min-h-[calc(100vh-4rem)]">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== homeHref && pathname.startsWith(item.href));
            const Icon = ICON_MAP[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "brand-gradient text-white"
                    : "text-muted hover:bg-border/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card">
        <div className="flex overflow-x-auto">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = ICON_MAP[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 px-1 text-xs min-w-0",
                  active ? "text-brand-magenta" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
