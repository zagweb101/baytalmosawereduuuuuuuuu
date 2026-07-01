import Link from "next/link";
import { BookOpen, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white font-bold text-xs">
                بم
              </div>
              <span className="font-bold">بيت المصور</span>
            </div>
            <p className="text-sm text-muted">
              منصة تعليمية متخصصة في التصوير الفوتوغرافي والفيديو للمصورين العرب
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/courses" className="hover:text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  الدورات
                </Link>
              </li>
              <li>
                <Link href="/verify-certificate" className="hover:text-foreground">
                  التحقق من الشهادة
                </Link>
              </li>
              <li>
                <Link href="/become-instructor" className="hover:text-foreground">
                  انضم كمدرب
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">تواصل معنا</h4>
            <p className="text-sm text-muted flex items-center gap-2">
              <Mail className="h-4 w-4" />
              info@baytalmosawer.com
            </p>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} بيت المصور. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
