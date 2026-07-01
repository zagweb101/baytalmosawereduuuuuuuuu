import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getCategories } from "@/lib/actions/settings";
import { db } from "@/lib/db";
import { canEditCourse } from "@/lib/permissions";
import { EditCourseClient } from "@/components/shared/edit-course-client";
import { UserRole } from "@prisma/client";
import { toNumber } from "@/lib/utils";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]);
  const { id } = await params;

  const course = await db.course.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
      quizzes: true,
    },
  });

  if (!course || !(await canEditCourse(user, course))) notFound();

  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <EditCourseClient
        course={{
          ...course,
          price: toNumber(course.price),
        }}
        categories={categories}
        hasQuiz={course.quizzes.length > 0}
      />
    </div>
  );
}
