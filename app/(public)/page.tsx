import Link from "next/link";
import { db } from "@/lib/db";
import { CourseStatus, type CourseLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/shared/course-card";
import { BookOpen, GraduationCap, Users, Award } from "lucide-react";

export const dynamic = "force-dynamic";

type FeaturedCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: { toNumber(): number } | number;
  level: CourseLevel;
  instructor: { name: string };
  _count: { enrollments: number };
};

export default async function HomePage() {
  let featuredCourses: FeaturedCourse[] = [];
  let courseCount = 0;
  let instructorCount = 0;
  let enrollmentCount = 0;
  let certificateCount = 0;

  try {
    const [courses, stats] = await Promise.all([
      db.course.findMany({
        where: { status: CourseStatus.PUBLISHED },
        include: {
          instructor: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 6,
      }),
      Promise.all([
        db.course.count({ where: { status: CourseStatus.PUBLISHED } }),
        db.user.count({ where: { role: "INSTRUCTOR" } }),
        db.enrollment.count(),
        db.certificate.count(),
      ]),
    ]);
    featuredCourses = courses as FeaturedCourse[];
    [courseCount, instructorCount, enrollmentCount, certificateCount] = stats;
  } catch {
    // قاعدة البيانات غير متصلة بعد
  }

  return (
    <>
      <section className="brand-gradient text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            تعلّم التصوير مع أفضل المدربين
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">
            منصة بيت المصور التعليمية — دورات احترافية في التصوير الفوتوغرافي،
            المونتاج، والإضاءة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white text-brand-purple hover:bg-white/90">
                <BookOpen className="h-5 w-5" />
                تصفح الدورات
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                <GraduationCap className="h-5 w-5" />
                ابدأ مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, value: courseCount, label: "دورة تعليمية" },
              { icon: Users, value: instructorCount, label: "مدرب محترف" },
              { icon: GraduationCap, value: enrollmentCount, label: "طالب مسجل" },
              { icon: Award, value: certificateCount, label: "شهادة صادرة" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <Icon className="h-8 w-8 mx-auto mb-2 text-brand-magenta" />
                <div className="text-3xl font-bold">{value}</div>
                <div className="text-sm text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">دورات مميزة</h2>
            <Link href="/courses">
              <Button variant="outline">عرض الكل</Button>
            </Link>
          </div>
          {featuredCourses.length === 0 ? (
            <p className="text-center text-muted py-12">لا توجد دورات منشورة حالياً</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  slug={course.slug}
                  thumbnail={course.thumbnail}
                  price={course.price}
                  level={course.level}
                  instructorName={course.instructor.name}
                  enrollmentCount={course._count.enrollments}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
