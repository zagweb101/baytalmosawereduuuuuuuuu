import Link from "next/link";
import { BookOpen, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border/50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-magenta/40 to-transparent" />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-gradient text-white font-bold text-xs shadow-md shadow-brand-purple/20">
                بم
              </div>
              <span className="font-bold text-lg">بيت المصور</span>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              نصنع مصوّري الجيل القادم في المملكة العربية السعودية — منصة
              تعليمية متخصصة في التصوير الفوتوغرافي والفيديو
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">روابط سريعة</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li>
                <Link
                  href="/courses"
                  className="group flex items-center gap-2 transition-colors duration-300 hover:text-foreground"
                >
                  <BookOpen className="h-4 w-4 text-brand-magenta-light transition-transform duration-300 group-hover:scale-110" />
                  الدورات
                </Link>
              </li>
              <li>
                <Link
                  href="/verify-certificate"
                  className="transition-colors duration-300 hover:text-foreground"
                >
                  التحقق من الشهادة
                </Link>
              </li>
              <li>
                <Link
                  href="/become-instructor"
                  className="transition-colors duration-300 hover:text-foreground"
                >
                  انضم كمدرب
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">تواصل معنا</h4>
            <p className="flex items-center gap-2 text-sm text-muted">
              <Mail className="h-4 w-4 text-brand-magenta-light" />
              info@baytalmosawer.com
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-border/50 pt-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} بيت المصور. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
