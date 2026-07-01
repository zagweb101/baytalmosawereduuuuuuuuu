"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getAdminEnrollments,
  cancelEnrollment,
} from "@/lib/actions/enrollments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type Enrollment = Awaited<ReturnType<typeof getAdminEnrollments>>[number];

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  CANCELLED: "ملغى",
  COMPLETED: "مكتمل",
};

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      setEnrollments(await getAdminEnrollments());
    });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">التسجيلات</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="text-start p-3">التاريخ</th>
              <th className="text-start p-3">الطالب</th>
              <th className="text-start p-3">الدورة</th>
              <th className="text-start p-3">الحالة</th>
              <th className="text-start p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id} className="border-b border-border">
                <td className="p-3">{formatDate(e.enrolledAt)}</td>
                <td className="p-3">
                  <div>{e.student.name}</div>
                  <div className="text-xs text-muted" dir="ltr">{e.student.email}</div>
                </td>
                <td className="p-3">
                  <Link
                    href={`/courses/${e.course.slug}`}
                    className="text-brand-purple hover:underline"
                  >
                    {e.course.title}
                  </Link>
                </td>
                <td className="p-3">
                  <Badge variant="outline">{statusLabels[e.status] ?? e.status}</Badge>
                </td>
                <td className="p-3">
                  {e.status === "ACTIVE" && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await cancelEnrollment(e.id);
                          if (result.success) {
                            setMessage(result.data.message);
                            load();
                          }
                        })
                      }
                    >
                      إلغاء التسجيل
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && <p className="text-green-600 text-sm mt-4">{message}</p>}
    </div>
  );
}
