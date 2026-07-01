import { requireRole } from "@/lib/auth/session";
import { getCategories } from "@/lib/actions/settings";
import { CourseForm } from "@/components/shared/course-form";
import { UserRole } from "@prisma/client";

export default async function NewCoursePage() {
  await requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]);
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <CourseForm categories={categories} />
    </div>
  );
}
