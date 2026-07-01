import Link from "next/link";
import { getMyCourses } from "@/lib/actions/enrollments";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default async function MyCoursesPage() {
  const enrollments = await getMyCourses();

  if (enrollments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="لا توجد دورات"
          description="ابدأ رحلتك التعليمية بالتسجيل في دورة"
          action={
            <Link href="/courses">
              <Button>تصفح الدورات</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">دوراتي</h1>
      <div className="grid gap-4">
        {enrollments.map((enrollment) => {
          const totalLessons = enrollment.course.sections.flatMap(
            (s) => s.lessons,
          ).length;
          const completed = enrollment.progress.filter(
            (p) => p.completedAt,
          ).length;
          const percent =
            totalLessons > 0
              ? Math.round((completed / totalLessons) * 100)
              : 0;

          return (
            <Card key={enrollment.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      {enrollment.course.instructor.name} ·{" "}
                      {enrollment.course.category.name}
                    </p>
                    <ProgressBar value={percent} className="mt-3 max-w-md" />
                  </div>
                  <Link href={`/dashboard/courses/${enrollment.courseId}/learn`}>
                    <Button>
                      {percent === 100 ? "مراجعة" : "متابعة التعلم"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
