import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getStudentDashboardStats } from "@/lib/actions/reports";
import { getContinueLearning, getMyCourses } from "@/lib/actions/enrollments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { BookOpen, Award, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function StudentDashboardPage() {
  const user = await requireAuth();
  const [stats, continueLearning, enrollments] = await Promise.all([
    getStudentDashboardStats(user.id),
    getContinueLearning(),
    getMyCourses(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">مرحباً، {user.name}</h1>
      <p className="text-muted mb-8">تابع رحلتك التعليمية</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: BookOpen, label: "دوراتي", value: stats.enrollments },
          { icon: Award, label: "شهاداتي", value: stats.certificates },
          { icon: ShoppingBag, label: "مشتريات", value: stats.orders },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-4">
              <Icon className="h-8 w-8 text-brand-magenta" />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {continueLearning.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">تابع التعلم</h2>
          <div className="grid gap-4">
            {continueLearning.map((enrollment) => {
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
              const lastViewed = enrollment.progress
                .filter((p) => p.lastViewedAt)
                .sort(
                  (a, b) =>
                    (b.lastViewedAt?.getTime() ?? 0) -
                    (a.lastViewedAt?.getTime() ?? 0),
                )[0];
              const learnHref = lastViewed
                ? `/dashboard/courses/${enrollment.courseId}/learn?lesson=${lastViewed.lessonId}`
                : `/dashboard/courses/${enrollment.courseId}/learn`;
              return (
              <Card key={enrollment.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{enrollment.course.title}</h3>
                    <ProgressBar
                      value={percent}
                      className="mt-2 max-w-xs"
                    />
                  </div>
                  <Link href={learnHref}>
                    <Button size="sm">متابعة</Button>
                  </Link>
                </CardContent>
              </Card>
            );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">دوراتي الأخيرة</h2>
          <Link href="/dashboard/my-courses">
            <Button variant="outline" size="sm">عرض الكل</Button>
          </Link>
        </div>
        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted">
              <p>لم تسجل في أي دورة بعد</p>
              <Link href="/courses">
                <Button className="mt-4">تصفح الدورات</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {enrollments.slice(0, 3).map((enrollment) => {
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
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{enrollment.course.title}</h3>
                    <ProgressBar value={percent} className="mt-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
