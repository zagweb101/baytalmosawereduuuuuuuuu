import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { isEnrolled } from "@/lib/permissions";
import { QuizPageClient } from "@/components/shared/quiz-page-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseQuizPage({ params }: PageProps) {
  const user = await requireRole(["STUDENT", "ADMIN"]);
  const { courseId } = await params;

  const enrolled = await isEnrolled(user.id, courseId);
  if (!enrolled && user.role !== "ADMIN") {
    redirect(`/courses`);
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      quizzes: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
        take: 1,
      },
    },
  });

  const quiz = course?.quizzes[0];
  if (!course || !quiz) {
    notFound();
  }

  const questions = quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: Array.isArray(q.options)
      ? (q.options as string[])
      : (JSON.parse(String(q.options ?? "[]")) as string[]),
  }));

  return (
    <QuizPageClient
      courseId={courseId}
      courseTitle={course.title}
      quizId={quiz.id}
      passScore={quiz.passingScore}
      questions={questions}
    />
  );
}
