import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourseBySlug } from "@/lib/actions/courses";
import { getCurrentUser } from "@/lib/auth/session";
import { isEnrolled } from "@/lib/permissions";
import { EnrollButton } from "@/components/shared/enroll-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, toNumber } from "@/lib/utils";
import { getPreviewLessonIdsForCourse } from "@/lib/preview";
import { Clock, Users, Star, PlayCircle } from "lucide-react";

const levelLabels = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "PUBLISHED") notFound();

  const user = await getCurrentUser();
  const enrolled = user ? await isEnrolled(user.id, course.id) : false;
  const price = toNumber(course.price);
  const isFree = price === 0;

  const totalLessons = course.sections.reduce(
    (acc, s) => acc + s.lessons.length,
    0,
  );

  const avgRating =
    course.reviews.length > 0
      ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
      : 0;

  const outcomes = (course.learningOutcomes as string[]) ?? [];
  const requirements = (course.requirements as string[]) ?? [];

  const sectionMeta = course.sections.map((s) => ({
    order: s.order,
    lessons: s.lessons.map((l) => ({
      id: l.id,
      order: l.order,
      isFreePreview: l.isFreePreview,
    })),
  }));
  const previewIds = await getPreviewLessonIdsForCourse(sectionMeta);
  const hasPreviewLessons = previewIds.size > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <Badge className="mb-3">{course.category.name}</Badge>
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-muted">{course.shortDescription ?? course.description.slice(0, 200)}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {course.durationHours} ساعة
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course._count.enrollments} طالب
              </span>
              {avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {avgRating.toFixed(1)}
                </span>
              )}
              <Badge variant="outline">{levelLabels[course.level]}</Badge>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4">عن الدورة</h2>
            <p className="text-muted whitespace-pre-wrap">{course.description}</p>
          </section>

          {outcomes.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">ماذا ستتعلم</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {outcomes.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-brand-magenta">✓</span>
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-4">المنهج</h2>
            <div className="space-y-4">
              {course.sections.map((section) => (
                <Card key={section.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{section.title}</h3>
                    <ul className="space-y-1">
                      {section.lessons.map((lesson) => (
                        <li
                          key={lesson.id}
                          className="text-sm text-muted flex justify-between items-center gap-2"
                        >
                          <span>{lesson.title}</span>
                          {previewIds.has(lesson.id) && !enrolled ? (
                            <Link
                              href={`/courses/${course.slug}/preview/${lesson.id}`}
                              className="flex items-center gap-1 text-brand-purple hover:underline text-xs shrink-0"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              معاينة
                            </Link>
                          ) : lesson.isFreePreview ? (
                            <Badge variant="outline" className="text-xs">
                              معاينة
                            </Badge>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {course.reviews.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">التقييمات</h2>
              <div className="space-y-4">
                {course.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.user.name}</span>
                        <span className="text-amber-500">{"★".repeat(review.rating)}</span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        <div>
          <Card className="sticky top-24">
            <div className="aspect-video bg-gradient-to-br from-brand-purple/20 to-brand-magenta/20">
              {course.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              )}
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="text-2xl font-bold text-brand-purple">
                {formatPrice(course.price)}
              </div>
              <EnrollButton
                courseId={course.id}
                slug={course.slug}
                isFree={isFree}
                isEnrolled={enrolled}
                isLoggedIn={!!user}
              />
              {hasPreviewLessons && !enrolled && (
                <p className="text-xs text-muted text-center">
                  {previewIds.size} دروس متاحة للمعاينة المجانية
                </p>
              )}
              <div className="text-sm text-muted space-y-2 pt-4 border-t border-border">
                <p>المدرب: {course.instructor.name}</p>
                <p>{totalLessons} درس</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
