import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/actions/courses";
import { getCurrentUser } from "@/lib/auth/session";
import { canPreviewLesson, isEnrolled } from "@/lib/permissions";
import { getPreviewLessonIdsForCourse } from "@/lib/preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnrollButton } from "@/components/shared/enroll-button";
import { toNumber } from "@/lib/utils";

export default async function LessonPreviewPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "PUBLISHED") notFound();

  const user = await getCurrentUser();
  const enrolled = user ? await isEnrolled(user.id, course.id) : false;

  if (enrolled) {
    notFound();
  }

  const sections = course.sections.map((s) => ({
    order: s.order,
    lessons: s.lessons.map((l) => ({
      id: l.id,
      order: l.order,
      isFreePreview: l.isFreePreview,
    })),
  }));

  const allowed = await canPreviewLesson(
    user,
    course,
    lessonId,
    sections,
  );
  if (!allowed) notFound();

  const previewIds = await getPreviewLessonIdsForCourse(sections);
  const allLessons = course.sections
    .flatMap((s) => s.lessons)
    .filter((l) => previewIds.has(l.id));
  const lesson = allLessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const price = toNumber(course.price);
  const isFree = price === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/courses/${course.slug}`}
          className="text-sm text-muted hover:text-foreground"
        >
          ← العودة للدورة
        </Link>
        <Badge variant="outline">معاينة مجانية</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-6">{lesson.title}</h1>

          {lesson.type === "VIDEO" && lesson.videoRef && (
            <div className="aspect-video bg-black rounded-xl mb-6 overflow-hidden">
              {lesson.videoRef.includes("youtube.com") ||
              lesson.videoRef.includes("youtu.be") ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${lesson.videoRef.match(/(?:youtu\.be\/|v=)([^&]+)/)?.[1] ?? ""}`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={lesson.videoRef}
                  controls
                  className="h-full w-full"
                  playsInline
                />
              )}
            </div>
          )}

          {lesson.content && (
            <div className="prose prose-sm max-w-none text-muted whitespace-pre-wrap mb-6">
              {lesson.content}
            </div>
          )}

          <Card className="bg-brand-purple/5 border-brand-purple/20">
            <CardContent className="p-6 text-center">
              <p className="font-medium mb-2">أعجبك المحتوى؟</p>
              <p className="text-sm text-muted mb-4">
                سجّل في الدورة للوصول لجميع الدروس والاختبار والشهادة
              </p>
              <EnrollButton
                courseId={course.id}
                slug={course.slug}
                isFree={isFree}
                isEnrolled={false}
                isLoggedIn={!!user}
              />
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">دروس المعاينة</h2>
              <ul className="space-y-2">
                {allLessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/courses/${course.slug}/preview/${l.id}`}
                      className={`block text-sm rounded-lg px-3 py-2 transition-colors ${
                        l.id === lessonId
                          ? "bg-brand-purple/10 text-brand-purple font-medium"
                          : "hover:bg-border/50 text-muted"
                      }`}
                    >
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`/courses/${course.slug}`} className="block mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  عرض تفاصيل الدورة
                </Button>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
