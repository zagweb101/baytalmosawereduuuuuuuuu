"use client";

import { useTransition, useEffect, useState } from "react";
import { getAllOrders, adminRefund } from "@/lib/actions/orders";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";

type Order = Awaited<ReturnType<typeof getAllOrders>>[number];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getAllOrders().then(setOrders);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">الطلبات</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="text-start p-3">الطالب</th>
              <th className="text-start p-3">الدورة</th>
              <th className="text-start p-3">المبلغ</th>
              <th className="text-start p-3">الحالة</th>
              <th className="text-start p-3">التاريخ</th>
              <th className="text-start p-3">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border">
                <td className="p-3">{order.student.name}</td>
                <td className="p-3">{order.course.title}</td>
                <td className="p-3">{formatPrice(order.amount)}</td>
                <td className="p-3"><OrderStatusBadge status={order.status} /></td>
                <td className="p-3">{formatDate(order.createdAt)}</td>
                <td className="p-3">
                  {order.status === "PAID" && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await adminRefund(order.id);
                          setOrders(await getAllOrders());
                        })
                      }
                    >
                      استرداد
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
