"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCourse } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

type Category = { id: string; name: string };

export function CourseForm({
  categories,
  course,
}: {
  categories: Category[];
  course?: { id: string; title: string; slug: string; description: string; shortDescription?: string | null; categoryId: string; level: string; price: number; durationHours: number; thumbnail?: string | null };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course ? "تعديل الدورة" : "دورة جديدة"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (!fd.get("slug") && fd.get("title")) {
              fd.set("slug", slugify(String(fd.get("title"))));
            }
            setError("");
            startTransition(async () => {
              const { createCourse: create, updateCourse } = await import("@/lib/actions/courses");
              if (course) {
                const result = await updateCourse(course.id, fd);
                if (result.success) {
                  router.refresh();
                } else {
                  setError(result.error);
                }
              } else {
                const result = await create(fd);
                if (result.success) {
                  router.push(`/instructor/courses/${result.data.id}/edit`);
                } else {
                  setError(result.error);
                }
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الدورة</Label>
            <Input id="title" name="title" defaultValue={course?.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">الرابط (slug)</Label>
            <Input id="slug" name="slug" defaultValue={course?.slug} dir="ltr" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortDescription">وصف مختصر</Label>
            <Input id="shortDescription" name="shortDescription" defaultValue={course?.shortDescription ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea id="description" name="description" defaultValue={course?.description} required rows={5} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">التصنيف</Label>
              <Select id="categoryId" name="categoryId" defaultValue={course?.categoryId} required>
                <option value="">اختر...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">المستوى</Label>
              <Select id="level" name="level" defaultValue={course?.level ?? "BEGINNER"} required>
                <option value="BEGINNER">مبتدئ</option>
                <option value="INTERMEDIATE">متوسط</option>
                <option value="ADVANCED">متقدم</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">السعر (ر.س)</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" defaultValue={course?.price ?? 0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationHours">المدة (ساعات)</Label>
              <Input id="durationHours" name="durationHours" type="number" min="0" defaultValue={course?.durationHours ?? 0} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnail">رابط الصورة</Label>
            <Input id="thumbnail" name="thumbnail" type="url" defaultValue={course?.thumbnail ?? ""} dir="ltr" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" loading={pending}>
            {course ? "حفظ" : "إنشاء"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
