import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { buttonVariants } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { PublicMobileNav } from "@/components/shared/public-mobile-nav";
import { GraduationCap, LayoutDashboard, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/courses", label: "الدورات" },
  { href: "/verify-certificate", label: "التحقق من الشهادة" },
];

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
        <div className="flex items-center gap-2">
          <PublicMobileNav links={publicLinks} />
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-gradient text-white font-bold text-sm shadow-lg shadow-brand-purple/30 transition-transform duration-500 group-hover:scale-105">
              بم
            </div>
            <span className="font-bold text-lg hidden sm:block transition-colors group-hover:text-brand-magenta-light">
              بيت المصور
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8" aria-label="التنقل الرئيسي">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm text-muted transition-colors duration-300 hover:text-foreground after:absolute after:-bottom-1 after:start-0 after:h-px after:w-0 after:bg-brand-magenta after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              {user.role === "STUDENT" && (
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">لوحتي</span>
                </Link>
              )}
              {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
                <Link
                  href="/instructor"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">المدرب</span>
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">الإدارة</span>
                </Link>
              )}
              <Link
                href="/dashboard/profile"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                دخول
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                تسجيل
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
