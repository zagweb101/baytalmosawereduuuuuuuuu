"use client";

import { useTransition } from "react";
import { getMyOrders, requestRefund } from "@/lib/actions/orders";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

type Order = Awaited<ReturnType<typeof getMyOrders>>[number];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getMyOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted">
        جاري التحميل...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="لا توجد طلبات"
          description="لم تقم بشراء أي دورة بعد"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">طلباتي</h1>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{order.course.title}</h3>
                  <p className="text-sm text-muted mt-1">
                    {formatDate(order.createdAt)} · {formatPrice(order.amount)}
                  </p>
                  <div className="mt-2">
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
                {order.status === "PAID" && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await requestRefund(order.id);
                        const updated = await getMyOrders();
                        setOrders(updated);
                      })
                    }
                  >
                    طلب استرداد
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
