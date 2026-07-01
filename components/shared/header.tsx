import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { BookOpen, GraduationCap, LayoutDashboard, Shield, User } from "lucide-react";

const publicLinks = [
  { href: "/courses", label: "الدورات" },
  { href: "/verify-certificate", label: "التحقق من الشهادة" },
];

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-gradient text-white font-bold text-sm">
            بم
          </div>
          <span className="font-bold text-lg hidden sm:block">بيت المصور</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted hover:text-foreground transition-colors"
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
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">لوحتي</span>
                  </Button>
                </Link>
              )}
              {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
                <Link href="/instructor">
                  <Button variant="ghost" size="sm">
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">المدرب</span>
                  </Button>
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">الإدارة</span>
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  دخول
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">تسجيل</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
