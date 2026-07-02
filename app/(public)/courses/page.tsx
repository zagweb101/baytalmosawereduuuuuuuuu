import Link from "next/link";
import { getCourses } from "@/lib/actions/courses";
import { getCategories } from "@/lib/actions/settings";
import { CourseCard } from "@/components/shared/course-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { buildCoursesPageUrl } from "@/lib/url";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseLevel } from "@prisma/client";

type SearchParams = Promise<{
  search?: string;
  category?: string;
  level?: string;
  price?: string;
  page?: string;
}>;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const categories = await getCategories();
  const filters = {
    search: params.search,
    category: params.category,
    level: params.level,
    price: params.price,
  };

  const { courses, totalPages } = await getCourses({
    search: params.search,
    categoryId: params.category,
    level: params.level as CourseLevel | undefined,
    priceType: params.price as "free" | "paid" | undefined,
    page,
  });

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="mb-10">
        <p className="mb-2 text-sm font-medium text-brand-magenta-light">الكتالوج</p>
        <h1 className="text-3xl font-bold md:text-4xl">الدورات التعليمية</h1>
      </div>

      <form className="glass-card mb-10 grid grid-cols-1 gap-4 p-5 md:grid-cols-4 md:p-6">
        <Input name="search" placeholder="ابحث عن دورة..." defaultValue={params.search} />
        <Select name="category" defaultValue={params.category ?? ""}>
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select name="level" defaultValue={params.level ?? ""}>
          <option value="">كل المستويات</option>
          <option value="BEGINNER">مبتدئ</option>
          <option value="INTERMEDIATE">متوسط</option>
          <option value="ADVANCED">متقدم</option>
        </Select>
        <Select name="price" defaultValue={params.price ?? ""}>
          <option value="">كل الأسعار</option>
          <option value="free">مجاني</option>
          <option value="paid">مدفوع</option>
        </Select>
        <Button type="submit" className="md:col-span-4 w-full md:w-auto">
          بحث
        </Button>
      </form>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="لا توجد دورات"
          description="جرب تغيير معايير البحث"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                slug={course.slug}
                thumbnail={course.thumbnail}
                price={course.price}
                level={course.level}
                instructorName={course.instructor.name}
                enrollmentCount={course._count.enrollments}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildCoursesPageUrl(p, filters)}
                  className={cn(
                    buttonVariants({
                      variant: p === page ? "primary" : "outline",
                      size: "sm",
                    }),
                  )}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
