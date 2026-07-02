import { db } from "@/lib/db";
import { CourseStatus, type CourseLevel } from "@prisma/client";
import { HomeLanding } from "@/components/shared/home-landing";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
    featuredCourses = courses.map((course) => ({
      ...course,
      price: toNumber(course.price),
    })) as FeaturedCourse[];
    [courseCount, instructorCount, enrollmentCount, certificateCount] = stats;
  } catch {
    // قاعدة البيانات غير متصلة بعد
  }

  return (
    <HomeLanding
      featuredCourses={featuredCourses}
      courseCount={courseCount}
      instructorCount={instructorCount}
      enrollmentCount={enrollmentCount}
      certificateCount={certificateCount}
    />
  );
}
