"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSection,
  createLesson,
  deleteSection,
  deleteLesson,
  submitForReview,
} from "@/lib/actions/courses";
import { createQuiz } from "@/lib/actions/quizzes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CourseForm } from "@/components/shared/course-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseStatusBadge } from "@/components/shared/status-badge";
import type { CourseStatus } from "@prisma/client";

type Section = {
  id: string;
  title: string;
  order: number;
  lessons: {
    id: string;
    title: string;
    type: string;
    order: number;
  }[];
};

type EditCourseClientProps = {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    shortDescription: string | null;
    categoryId: string;
    level: string;
    price: number;
    durationHours: number;
    thumbnail: string | null;
    status: CourseStatus;
    rejectionReason: string | null;
    sections: Section[];
  };
  categories: { id: string; name: string }[];
  hasQuiz: boolean;
};

export function EditCourseClient({ course, categories, hasQuiz }: EditCourseClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "curriculum" | "quiz">("info");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const tabs = [
    { id: "info" as const, label: "المعلومات" },
    { id: "curriculum" as const, label: "المنهج" },
    { id: "quiz" as const, label: "الاختبار" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <CourseStatusBadge status={course.status} />
      </div>
      {course.rejectionReason && (
        <p className="text-red-500 text-sm">سبب الرفض: {course.rejectionReason}</p>
      )}

      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t.id
                ? "border-brand-magenta text-brand-magenta"
                : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div>
          <CourseForm
            categories={categories}
            course={{
              ...course,
              price: course.price,
            }}
          />
          {(course.status === "DRAFT" || course.status === "REJECTED") && (
            <Button
              className="mt-4"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await submitForReview(course.id);
                  if (result.success) {
                    setMessage(result.data.message);
                    router.refresh();
                  } else {
                    setError(result.error);
                  }
                })
              }
            >
              إرسال للمراجعة
            </Button>
          )}
        </div>
      )}

      {tab === "curriculum" && (
        <div className="space-y-6">
          {course.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{section.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteSection(section.id);
                      router.refresh();
                    })
                  }
                >
                  حذف
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between text-sm">
                    <span>{lesson.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteLesson(lesson.id);
                          router.refresh();
                        })
                      }
                    >
                      حذف
                    </Button>
                  </div>
                ))}
                <form
                  className="flex gap-2 mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    fd.set("sectionId", section.id);
                    fd.set("type", "VIDEO");
                    fd.set("order", String(section.lessons.length));
                    startTransition(async () => {
                      await createLesson(fd);
                      router.refresh();
                      e.currentTarget.reset();
                    });
                  }}
                >
                  <Input name="title" placeholder="عنوان الدرس" required className="flex-1" />
                  <Button type="submit" size="sm">إضافة</Button>
                </form>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="p-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("courseId", course.id);
                  fd.set("order", String(course.sections.length));
                  startTransition(async () => {
                    await createSection(fd);
                    router.refresh();
                    e.currentTarget.reset();
                  });
                }}
              >
                <Input name="title" placeholder="عنوان القسم الجديد" required className="flex-1" />
                <Button type="submit">إضافة قسم</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "quiz" && (
        <Card>
          <CardContent className="p-6">
            {hasQuiz ? (
              <p className="text-muted">تم إنشاء اختبار لهذه الدورة</p>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("courseId", course.id);
                  fd.set(
                    "questions",
                    JSON.stringify([
                      {
                        text: String(fd.get("questionText")),
                        type: "MULTIPLE_CHOICE",
                        options: ["أ", "ب", "ج", "د"],
                        correctAnswer: String(fd.get("correctAnswer")),
                        order: 0,
                      },
                    ]),
                  );
                  startTransition(async () => {
                    const result = await createQuiz(fd);
                    if (result.success) {
                      setMessage("تم إنشاء الاختبار");
                      router.refresh();
                    } else {
                      setError(result.error);
                    }
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الاختبار</Label>
                  <Input id="title" name="title" defaultValue={`اختبار ${course.title}`} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingScore">درجة النجاح (%)</Label>
                  <Input id="passingScore" name="passingScore" type="number" defaultValue={70} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionText">السؤال</Label>
                  <Input id="questionText" name="questionText" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correctAnswer">الإجابة الصحيحة</Label>
                  <Input id="correctAnswer" name="correctAnswer" required />
                </div>
                <Button type="submit" loading={pending}>إنشاء اختبار</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {message && <p className="text-green-600 text-sm">{message}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
