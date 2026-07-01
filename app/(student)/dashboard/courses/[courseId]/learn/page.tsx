import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getProgress } from "@/lib/actions/enrollments";
import { hasPassedQuiz } from "@/lib/actions/quizzes";
import { getUserReview } from "@/lib/actions/reviews";
import { db } from "@/lib/db";
import { LearnPageClient } from "@/components/shared/learn-page-client";
import { CourseReviewForm } from "@/components/shared/course-review-form";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireAuth();
  const { courseId } = await params;

  const progress = await getProgress(courseId);
  if (!progress) redirect("/dashboard/my-courses");

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
          },
        },
      },
      quizzes: true,
    },
  });

  if (!course) notFound();

  const completedIds = progress.enrollment.progress
    .filter((p) => p.completedAt)
    .map((p) => p.lessonId);

  const quizPassed = await hasPassedQuiz(user.id, courseId);
  const hasQuiz = course.quizzes.length > 0;
  const canIssueCertificate = !hasQuiz || quizPassed;
  const userReview = await getUserReview(courseId);
  const quiz = course.quizzes[0] ?? null;

  return (
    <>
      <LearnPageClient
        courseId={courseId}
        courseTitle={course.title}
        sections={course.sections}
        completedLessonIds={completedIds}
        percent={progress.percent}
        canIssueCertificate={canIssueCertificate}
        quiz={quiz ? { id: quiz.id, title: quiz.title } : null}
      />
      <div className="container mx-auto px-4 pb-12 max-w-3xl lg:ms-80">
        <CourseReviewForm
          courseId={courseId}
          courseTitle={course.title}
          existingReview={userReview}
        />
      </div>
    </>
  );
}
