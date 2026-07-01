import {
  getFinancialReport,
  getPublishedCoursesForReport,
} from "@/lib/actions/reports";
import { AdminReportsClient } from "@/components/shared/admin-reports-client";

export default async function AdminReportsPage() {
  const [{ orders, totals }, courses] = await Promise.all([
    getFinancialReport(),
    getPublishedCoursesForReport(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">التقارير</h1>
      <AdminReportsClient
        initialOrders={orders}
        initialTotals={totals}
        courses={courses}
      />
    </div>
  );
}
