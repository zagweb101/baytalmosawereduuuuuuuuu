import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { formatDate } from "@/lib/utils";

export default async function InstructorStudentsPage() {
  const user = await requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]);

  const enrollments = await db.enrollment.findMany({
    where: { course: { instructorId: user.id } },
    include: {
      student: { select: { name: true, email: true } },
      course: { select: { title: true } },
      progress: true,
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">الطلاب المسجلون</h1>
      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted">
            لا يوجد طلاب مسجلون بعد
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="text-start p-3">الطالب</th>
                <th className="text-start p-3">الدورة</th>
                <th className="text-start p-3">تاريخ التسجيل</th>
                <th className="text-start p-3">الدروس المكتملة</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-border">
                  <td className="p-3">
                    <div>{e.student.name}</div>
                    <div className="text-xs text-muted" dir="ltr">{e.student.email}</div>
                  </td>
                  <td className="p-3">{e.course.title}</td>
                  <td className="p-3">{formatDate(e.enrolledAt)}</td>
                  <td className="p-3">{e.progress.filter((p) => p.completedAt).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
