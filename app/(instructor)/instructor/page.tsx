import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getInstructorStats } from "@/lib/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, DollarSign, Clock } from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function InstructorDashboardPage() {
  const user = await requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]);
  const stats = await getInstructorStats(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">لوحة المدرب</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen, label: "الدورات", value: stats.courses },
          { icon: Users, label: "الطلاب", value: stats.enrollments },
          { icon: DollarSign, label: "الإيرادات (ر.س)", value: stats.revenue.toFixed(0) },
          { icon: Clock, label: "قيد المراجعة", value: stats.pendingReview },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-4">
              <Icon className="h-8 w-8 text-brand-magenta" />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-4">
        <Link href="/instructor/courses/new">
          <Button>إنشاء دورة جديدة</Button>
        </Link>
        <Link href="/instructor/courses">
          <Button variant="outline">إدارة الدورات</Button>
        </Link>
      </div>
    </div>
  );
}
