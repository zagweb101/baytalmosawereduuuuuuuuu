"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { quizSchema } from "@/lib/validation/schemas";
import { requireAuth } from "@/lib/auth/session";
import { canEditCourse, isEnrolled } from "@/lib/permissions";
import { failure, success, type ActionResult } from "@/lib/actions/types";

export async function createQuiz(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();

  const questionsRaw = formData.get("questions");
  let questions = [];
  try {
    questions = JSON.parse(String(questionsRaw ?? "[]"));
  } catch {
    return failure("بيانات الأسئلة غير صالحة");
  }

  const parsed = quizSchema.safeParse({
    title: formData.get("title"),
    passingScore: Number(formData.get("passingScore") ?? 70),
    timeLimitMinutes: formData.get("timeLimitMinutes")
      ? Number(formData.get("timeLimitMinutes"))
      : undefined,
    courseId: formData.get("courseId") || undefined,
    lessonId: formData.get("lessonId") || undefined,
    questions,
  });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }

  if (parsed.data.courseId) {
    const course = await db.course.findUnique({
      where: { id: parsed.data.courseId },
    });
    if (!course || !(await canEditCourse(user, course))) {
      return failure("ليس لديك صلاحية");
    }
  }

  const { questions: qList, ...quizData } = parsed.data;

  const quiz = await db.quiz.create({
    data: {
      ...quizData,
      questions: {
        create: qList.map((q) => ({
          text: q.text,
          type: q.type,
          options: q.options ?? [],
          correctAnswer: q.correctAnswer,
          order: q.order,
        })),
      },
    },
  });

  if (parsed.data.courseId) {
    revalidatePath(`/instructor/courses/${parsed.data.courseId}/edit`);
  }

  return success({ id: quiz.id });
}

export async function submitAttempt(
  quizId: string,
  answers: Record<string, string>,
): Promise<ActionResult<{ score: number; passed: boolean }>> {
  const user = await requireAuth();

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) return failure("الاختبار غير موجود");

  if (!quiz.courseId) {
    return failure("الاختبار غير مرتبط بدورة");
  }
  if (!(await isEnrolled(user.id, quiz.courseId))) {
    return failure("يجب التسجيل في الدورة أولاً");
  }

  let correct = 0;
  for (const question of quiz.questions) {
    const answer = answers[question.id]?.trim().toLowerCase();
    const correctAnswer = question.correctAnswer.trim().toLowerCase();
    if (answer === correctAnswer) correct++;
  }

  const score =
    quiz.questions.length > 0
      ? Math.round((correct / quiz.questions.length) * 100)
      : 0;
  const passed = score >= quiz.passingScore;

  await db.quizAttempt.create({
    data: {
      quizId,
      userId: user.id,
      score,
      passed,
      answers,
      completedAt: new Date(),
    },
  });

  if (quiz.courseId && passed) {
    revalidatePath("/dashboard/certificates");
  }

  return success({ score, passed });
}

export async function hasPassedQuiz(userId: string, courseId: string) {
  const quiz = await db.quiz.findFirst({ where: { courseId } });
  if (!quiz) return true;

  const attempt = await db.quizAttempt.findFirst({
    where: { quizId: quiz.id, userId, passed: true },
  });

  return !!attempt;
}
