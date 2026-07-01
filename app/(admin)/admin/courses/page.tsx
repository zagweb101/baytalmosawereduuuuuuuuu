import { db } from "@/lib/db";
import { CourseStatusBadge } from "@/components/shared/status-badge";
import { formatPrice } from "@/lib/utils";

export default async function AdminCoursesPage() {
  const courses = await db.course.findMany({
    include: {
      instructor: { select: { name: true } },
      category: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">جميع الدورات</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="text-start p-3">العنوان</th>
              <th className="text-start p-3">المدرب</th>
              <th className="text-start p-3">التصنيف</th>
              <th className="text-start p-3">السعر</th>
              <th className="text-start p-3">الحالة</th>
              <th className="text-start p-3">الطلاب</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b border-border">
                <td className="p-3">{course.title}</td>
                <td className="p-3">{course.instructor.name}</td>
                <td className="p-3">{course.category.name}</td>
                <td className="p-3">{formatPrice(course.price)}</td>
                <td className="p-3"><CourseStatusBadge status={course.status} /></td>
                <td className="p-3">{course._count.enrollments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
