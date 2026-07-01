"use client";

import { useTransition, useEffect, useState } from "react";
import { getPendingInstructors, approveInstructor } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Instructor = Awaited<ReturnType<typeof getPendingInstructors>>[number];

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getPendingInstructors().then(setInstructors);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">المدربون بانتظار الموافقة</h1>
      {instructors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted">
            لا توجد طلبات معلقة
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instructors.map((instructor) => (
            <Card key={instructor.id}>
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{instructor.name}</h3>
                  <p className="text-sm text-muted" dir="ltr">{instructor.email}</p>
                  {instructor.bio && (
                    <p className="text-sm mt-2 line-clamp-2">{instructor.bio}</p>
                  )}
                  <p className="text-xs text-muted mt-1">
                    {formatDate(instructor.createdAt)}
                  </p>
                </div>
                <Button
                  loading={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await approveInstructor(instructor.id);
                      setInstructors(await getPendingInstructors());
                    })
                  }
                >
                  موافقة
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
