import { getDashboardStats } from "@/lib/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  ShoppingBag,
  GraduationCap,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">لوحة الإدارة</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "المستخدمون", value: stats.totalUsers },
          { icon: BookOpen, label: "الدورات المنشورة", value: stats.publishedCourses },
          { icon: GraduationCap, label: "التسجيلات", value: stats.totalEnrollments },
          { icon: ShoppingBag, label: "الإيرادات (ر.س)", value: stats.totalRevenue.toFixed(0) },
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted">إجمالي الدورات</p>
            <p className="text-xl font-bold">{stats.totalCourses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted">قيد المراجعة</p>
            <p className="text-xl font-bold">{stats.pendingCourses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted">الطلبات المدفوعة</p>
            <p className="text-xl font-bold">{stats.paidOrders}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
