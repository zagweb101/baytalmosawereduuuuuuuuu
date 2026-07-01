import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { CourseStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { UserRole } from "@prisma/client";

export default async function InstructorCoursesPage() {
  const user = await requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]);

  const courses = await db.course.findMany({
    where: { instructorId: user.id },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">دوراتي</h1>
        <Link href="/instructor/courses/new">
          <Button>دورة جديدة</Button>
        </Link>
      </div>
      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted">
            <p>لم تنشئ أي دورة بعد</p>
            <Link href="/instructor/courses/new">
              <Button className="mt-4">إنشاء دورة</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{course.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted">
                    <CourseStatusBadge status={course.status} />
                    <span>{formatPrice(course.price)}</span>
                    <span>{course._count.enrollments} طالب</span>
                  </div>
                </div>
                <Link href={`/instructor/courses/${course.id}/edit`}>
                  <Button variant="outline" size="sm">تعديل</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
