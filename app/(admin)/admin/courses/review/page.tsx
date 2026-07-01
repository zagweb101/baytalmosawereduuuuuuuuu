"use client";

import { useTransition, useEffect, useState } from "react";
import { publishCourse, rejectCourse, getReviewCourses } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type ReviewCourse = Awaited<ReturnType<typeof getReviewCourses>>[number];

export default function AdminReviewPage() {
  const [courses, setCourses] = useState<ReviewCourse[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getReviewCourses().then(setCourses);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">دورات قيد المراجعة</h1>
      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted">
            لا توجد دورات بانتظار المراجعة
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <h3 className="font-semibold">{course.title}</h3>
                <p className="text-sm text-muted mt-1">
                  {course.instructor.name} · {course.category.name}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button
                    loading={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await publishCourse(course.id);
                        setCourses(await getReviewCourses());
                      })
                    }
                  >
                    نشر
                  </Button>
                  <Input
                    placeholder="سبب الرفض"
                    value={reasons[course.id] ?? ""}
                    onChange={(e) =>
                      setReasons((prev) => ({
                        ...prev,
                        [course.id]: e.target.value,
                      }))
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="danger"
                    loading={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await rejectCourse(course.id, reasons[course.id] ?? "");
                        setCourses(await getReviewCourses());
                      })
                    }
                  >
                    رفض
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
