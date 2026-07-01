"use client";

import { useState, useTransition } from "react";
import {
  getFinancialReport,
  getCourseReport,
  exportFinancialReportCsv,
  getPublishedCoursesForReport,
} from "@/lib/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatDate } from "@/lib/utils";

type Order = Awaited<ReturnType<typeof getFinancialReport>>["orders"][number];
type Totals = Awaited<ReturnType<typeof getFinancialReport>>["totals"];
type CourseOption = Awaited<ReturnType<typeof getPublishedCoursesForReport>>[number];
type CourseReport = NonNullable<Awaited<ReturnType<typeof getCourseReport>>>;

type AdminReportsClientProps = {
  initialOrders: Order[];
  initialTotals: Totals;
  courses: CourseOption[];
};

export function AdminReportsClient({
  initialOrders,
  initialTotals,
  courses,
}: AdminReportsClientProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [totals, setTotals] = useState(initialTotals);
  const [courseId, setCourseId] = useState("");
  const [courseReport, setCourseReport] = useState<CourseReport | null>(null);
  const [pending, startTransition] = useTransition();

  const applyFilter = () => {
    startTransition(async () => {
      const data = await getFinancialReport(
        dateFrom || undefined,
        dateTo || undefined,
      );
      setOrders(data.orders);
      setTotals(data.totals);
    });
  };

  const downloadCsv = () => {
    startTransition(async () => {
      const result = await exportFinancialReportCsv(
        dateFrom || undefined,
        dateTo || undefined,
      );
      if (result.success) {
        const blob = new Blob([result.data.csv], {
          type: "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `financial-report-${dateFrom || "all"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const loadCourseReport = () => {
    if (!courseId) return;
    startTransition(async () => {
      const report = await getCourseReport(courseId);
      setCourseReport(report);
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label htmlFor="dateFrom">من تاريخ</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dateTo">إلى تاريخ</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <Button onClick={applyFilter} loading={pending} variant="outline">
          تطبيق الفلتر
        </Button>
        <Button onClick={downloadCsv} loading={pending}>
          تصدير CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المبيعات", value: totals.gross },
          { label: "الضريبة", value: totals.tax },
          { label: "عمولة المنصة", value: totals.commission },
          { label: "صافي المدربين", value: totals.instructorNet },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className="text-xl font-bold">{formatPrice(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="text-start p-3">التاريخ</th>
              <th className="text-start p-3">الطالب</th>
              <th className="text-start p-3">الدورة</th>
              <th className="text-start p-3">المدرب</th>
              <th className="text-start p-3">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border">
                <td className="p-3">{formatDate(order.createdAt)}</td>
                <td className="p-3">{order.student.name}</td>
                <td className="p-3">{order.course.title}</td>
                <td className="p-3">{order.instructor.name}</td>
                <td className="p-3">{formatPrice(order.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">تقرير دورة</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <select
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm min-w-[200px]"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">اختر دورة...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <Button onClick={loadCourseReport} loading={pending} variant="outline">
              عرض التقرير
            </Button>
          </div>
          {courseReport && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted">التسجيلات</p>
                <p className="font-bold">{courseReport.course._count.enrollments}</p>
              </div>
              <div>
                <p className="text-muted">الإيرادات</p>
                <p className="font-bold">{formatPrice(courseReport.revenue)}</p>
              </div>
              <div>
                <p className="text-muted">متوسط التقييم</p>
                <p className="font-bold">{courseReport.averageRating.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-muted">نسبة الإكمال</p>
                <p className="font-bold">{courseReport.completionRate}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
