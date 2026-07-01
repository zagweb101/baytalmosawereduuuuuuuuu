"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitAttempt } from "@/lib/actions/quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Question = {
  id: string;
  text: string;
  options: string[];
};

type QuizPageClientProps = {
  courseId: string;
  courseTitle: string;
  quizId: string;
  passScore: number;
  questions: Question[];
};

export function QuizPageClient({
  courseId,
  courseTitle,
  quizId,
  passScore,
  questions,
}: QuizPageClientProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/dashboard/courses/${courseId}/learn`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← العودة للدورة
      </Link>
      <h1 className="mt-4 text-2xl font-bold">اختبار: {courseTitle}</h1>
      <p className="mt-2 text-sm text-muted">
        درجة النجاح المطلوبة: {passScore}%
      </p>

      {result ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              {result.passed ? "أحسنت! لقد نجحت" : "لم تجتز الاختبار"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">درجتك: {result.score}%</p>
            <Link href={`/dashboard/courses/${courseId}/learn`} className="mt-4 inline-block">
              <Button>العودة للدورة</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const answerMap: Record<string, string> = {};
              for (const q of questions) {
                const idx = answers[q.id];
                if (idx !== undefined && q.options[idx]) {
                  answerMap[q.id] = q.options[idx];
                }
              }
              const res = await submitAttempt(quizId, answerMap);
              if (res.success && res.data) {
                setResult({ score: res.data.score, passed: res.data.passed });
              }
            });
          }}
        >
          {questions.map((q, index) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {index + 1}. {q.text}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-border/30"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === optionIndex}
                      onChange={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: optionIndex,
                        }))
                      }
                      required
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          ))}
          <Button type="submit" loading={pending} size="lg" className="w-full">
            تسليم الإجابات
          </Button>
        </form>
      )}
    </div>
  );
}
