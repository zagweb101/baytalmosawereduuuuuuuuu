import { getFinancialReport } from "@/lib/actions/reports";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatDate } from "@/lib/utils";

export default async function AdminReportsPage() {
  const { orders, totals } = await getFinancialReport();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">التقارير المالية</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
    </div>
  );
}
