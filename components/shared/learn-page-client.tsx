"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { markLessonComplete, updateLastViewed } from "@/lib/actions/enrollments";
import { issueCertificate } from "@/lib/actions/certificates";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Lesson = {
  id: string;
  title: string;
  type: string;
  content: string | null;
  videoRef: string | null;
  order: number;
};

type Section = {
  id: string;
  title: string;
  lessons: Lesson[];
};

type LearnPageClientProps = {
  courseId: string;
  courseTitle: string;
  sections: Section[];
  completedLessonIds: string[];
  percent: number;
  canIssueCertificate: boolean;
  quiz: { id: string; title: string } | null;
  initialLessonId?: string;
};

export function LearnPageClient({
  courseId,
  courseTitle,
  sections,
  completedLessonIds,
  percent,
  canIssueCertificate,
  quiz,
  initialLessonId,
}: LearnPageClientProps) {
  const allLessons = sections.flatMap((s) => s.lessons);
  const [activeLessonId, setActiveLessonId] = useState(
    initialLessonId ?? allLessons[0]?.id,
  );
  const [completed, setCompleted] = useState(new Set(completedLessonIds));
  const [progress, setProgress] = useState(percent);
  const [certMessage, setCertMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const activeLesson = allLessons.find((l) => l.id === activeLessonId);
  const lastTrackedLesson = useRef<string | null>(null);

  useEffect(() => {
    if (!activeLessonId || lastTrackedLesson.current === activeLessonId) {
      return;
    }
    lastTrackedLesson.current = activeLessonId;
    void updateLastViewed(activeLessonId);
  }, [activeLessonId]);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      <aside className="w-full lg:w-80 border-e border-border bg-card overflow-y-auto max-h-[40vh] lg:max-h-none lg:min-h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-border">
          <Link href="/dashboard/my-courses" className="text-sm text-muted hover:text-foreground">
            ← دوراتي
          </Link>
          <h2 className="font-semibold mt-2 line-clamp-2">{courseTitle}</h2>
          <ProgressBar value={progress} className="mt-3" size="sm" />
          {quiz && (
            <Link
              href={`/dashboard/courses/${courseId}/quiz`}
              className="mt-3 block text-sm text-brand-purple hover:underline"
            >
              اختبار الدورة: {quiz.title}
            </Link>
          )}
        </div>
        <nav className="p-2">
          {sections.map((section) => (
            <div key={section.id} className="mb-4">
              <p className="text-xs font-semibold text-muted px-2 mb-1">
                {section.title}
              </p>
              {section.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={cn(
                    "w-full text-start px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                    activeLessonId === lesson.id
                      ? "bg-brand-purple/10 text-brand-purple"
                      : "hover:bg-border/50",
                  )}
                >
                  {completed.has(lesson.id) && (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                  <span className="line-clamp-1">{lesson.title}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 lg:p-8">
        {activeLesson ? (
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">{activeLesson.title}</h1>
            {activeLesson.type === "VIDEO" && activeLesson.videoRef && (
              <div className="aspect-video bg-black rounded-xl mb-6 overflow-hidden">
                {activeLesson.videoRef.includes("youtube.com") ||
                activeLesson.videoRef.includes("youtu.be") ? (
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${activeLesson.videoRef.match(/(?:youtu\.be\/|v=)([^&]+)/)?.[1] ?? ""}`}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeLesson.videoRef}
                    controls
                    className="h-full w-full"
                    playsInline
                  />
                )}
              </div>
            )}
            {activeLesson.content && (
              <div className="prose prose-sm max-w-none text-muted whitespace-pre-wrap mb-6">
                {activeLesson.content}
              </div>
            )}
            {!activeLesson.content && !activeLesson.videoRef && (
              <Card className="mb-6">
                <CardContent className="p-8 text-center text-muted">
                  محتوى الدرس قيد الإعداد
                </CardContent>
              </Card>
            )}
            <div className="flex gap-3">
              <Button
                loading={pending}
                disabled={completed.has(activeLesson.id)}
                onClick={() =>
                  startTransition(async () => {
                    const result = await markLessonComplete(activeLesson.id);
                    if (result.success) {
                      setCompleted((prev) => new Set([...prev, activeLesson.id]));
                      const newCompleted = completed.size + 1;
                      const newPercent =
                        allLessons.length > 0
                          ? Math.round((newCompleted / allLessons.length) * 100)
                          : 0;
                      setProgress(newPercent);
                    }
                  })
                }
              >
                {completed.has(activeLesson.id) ? "مكتمل" : "إكمال الدرس"}
              </Button>
              {canIssueCertificate && progress >= 100 && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await issueCertificate(courseId);
                      if (result.success) {
                        setCertMessage(
                          `تم إصدار الشهادة: ${result.data.certificateNumber}`,
                        );
                      } else {
                        setCertMessage(result.error);
                      }
                    })
                  }
                >
                  الحصول على الشهادة
                </Button>
              )}
            </div>
            {certMessage && (
              <p className="mt-4 text-sm text-brand-purple">{certMessage}</p>
            )}
          </div>
        ) : (
          <p className="text-muted">لا توجد دروس</p>
        )}
      </main>
    </div>
  );
}
