"use client";

import { useState } from "react";
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
  MoreHorizontal,
  Plus,
  Settings,
  ShoppingBag,
  Star,
  Ticket,
  User,
  Users,
  X,
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
  mobileMaxItems?: number;
};

export function DashboardSidebar({
  items,
  title,
  homeHref = "/dashboard",
  mobileMaxItems = 5,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const mobilePrimary = items.slice(0, mobileMaxItems - 1);
  const mobileOverflow = items.slice(mobileMaxItems - 1);

  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col border-e border-border bg-card min-h-[calc(100vh-4rem)]">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1" aria-label={title}>
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

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card"
        aria-label={`${title} — جوال`}
      >
        <div className="flex">
          {mobilePrimary.map((item) => {
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
          {mobileOverflow.length > 0 && (
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-1 py-2 px-1 text-xs min-w-0 text-muted"
              aria-expanded={moreOpen}
              aria-controls="sidebar-more-menu"
              onClick={() => setMoreOpen(true)}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
              <span className="truncate">المزيد</span>
            </button>
          )}
        </div>
      </nav>

      {moreOpen && mobileOverflow.length > 0 && (
        <div
          id="sidebar-more-menu"
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="المزيد من الروابط"
        >
          <div className="absolute bottom-0 inset-x-0 rounded-t-2xl border-t border-border bg-card p-4 pb-8 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">المزيد</h3>
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 hover:bg-border/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {mobileOverflow.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = ICON_MAP[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm",
                      active
                        ? "brand-gradient text-white"
                        : "hover:bg-border/50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
