"use client";

import Link from "next/link";
import type { CourseLevel } from "@prisma/client";
import {
  Award,
  BookOpen,
  GraduationCap,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/shared/course-card";
import { CinematicHero } from "@/components/shared/cinematic-hero";
import { Reveal } from "@/components/shared/reveal";
import { AnimatedCounter } from "@/components/shared/animated-counter";

type FeaturedCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  level: CourseLevel;
  instructor: { name: string };
  _count: { enrollments: number };
};

type HomeLandingProps = {
  featuredCourses: FeaturedCourse[];
  courseCount: number;
  instructorCount: number;
  enrollmentCount: number;
  certificateCount: number;
};

const partners = ["Sony", "Nanlite", "نيوم", "جامعة الملك عبدالعزيز"];

const statItems: {
  icon: LucideIcon;
  key: keyof Pick<
    HomeLandingProps,
    "courseCount" | "instructorCount" | "enrollmentCount" | "certificateCount"
  >;
  label: string;
}[] = [
  { icon: BookOpen, key: "courseCount", label: "دورة تعليمية" },
  { icon: Users, key: "instructorCount", label: "مدرب محترف" },
  { icon: GraduationCap, key: "enrollmentCount", label: "طالب مسجل" },
  { icon: Award, key: "certificateCount", label: "شهادة صادرة" },
];

export function HomeLanding({
  featuredCourses,
  courseCount,
  instructorCount,
  enrollmentCount,
  certificateCount,
}: HomeLandingProps) {
  const stats = {
    courseCount,
    instructorCount,
    enrollmentCount,
    certificateCount,
  };

  return (
    <>
      <CinematicHero />

      <section className="relative border-b border-border/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {statItems.map(({ icon: Icon, key, label }, i) => (
              <Reveal key={label} delay={i * 80}>
                <div className="glass-card group p-6 text-center transition-transform duration-500 hover:-translate-y-1">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple/10 transition-colors group-hover:bg-brand-magenta/15">
                    <Icon className="h-6 w-6 text-brand-magenta-light" />
                  </div>
                  <div className="text-3xl font-bold brand-gradient-text">
                    <AnimatedCounter value={stats[key]} />
                  </div>
                  <div className="mt-1 text-sm text-muted">{label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <Reveal>
            <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-muted">
              شركاء النجاح
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
              {partners.map((name, i) => (
                <Reveal key={name} delay={i * 60} direction="none">
                  <span className="text-lg font-semibold text-muted/60 transition-colors duration-300 hover:text-foreground/80 md:text-xl">
                    {name}
                  </span>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-brand-magenta-light">
                  محتوى مختار
                </p>
                <h2 className="text-3xl font-bold md:text-4xl">دورات مميزة</h2>
                <p className="mt-2 max-w-lg text-muted">
                  اكتشف أحدث دورات التصوير والإضاءة والمونتاج من مدربي بيت
                  المصور
                </p>
              </div>
              <Link href="/courses">
                <Button variant="outline" className="shrink-0">
                  عرض الكل
                </Button>
              </Link>
            </div>
          </Reveal>

          {featuredCourses.length === 0 ? (
            <Reveal>
              <p className="py-16 text-center text-muted">
                لا توجد دورات منشورة حالياً
              </p>
            </Reveal>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course, i) => (
                <Reveal key={course.id} delay={i * 100}>
                  <CourseCard
                    id={course.id}
                    title={course.title}
                    slug={course.slug}
                    thumbnail={course.thumbnail}
                    price={course.price}
                    level={course.level}
                    instructorName={course.instructor.name}
                    enrollmentCount={course._count.enrollments}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-border/50 p-10 text-center md:p-16">
              <div
                className="absolute inset-0 brand-gradient opacity-10"
                aria-hidden
              />
              <div className="relative z-10">
                <h2 className="text-2xl font-bold md:text-3xl">
                  جاهز لتطوير مهاراتك في التصوير؟
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-muted">
                  انضم إلى آلاف المصورين العرب الذين يتعلمون مع بيت المصور
                </p>
                <Link href="/register" className="mt-8 inline-block">
                  <Button size="lg" className="btn-shimmer">
                    <GraduationCap className="h-5 w-5" />
                    سجّل الآن مجاناً
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
