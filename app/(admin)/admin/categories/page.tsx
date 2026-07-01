"use client";

import { useTransition, useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Category = Awaited<ReturnType<typeof getCategories>>[number];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">التصنيفات</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>إضافة تصنيف</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                await createCategory(fd);
                setCategories(await getCategories());
                e.currentTarget.reset();
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">الرابط</Label>
              <Input id="slug" name="slug" required dir="ltr" />
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={pending}>إضافة</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="font-medium">{cat.name}</span>
                <span className="text-sm text-muted ms-2" dir="ltr">{cat.slug}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    await deleteCategory(cat.id);
                    setCategories(await getCategories());
                  })
                }
              >
                حذف
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
