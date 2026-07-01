"use client";

import { useTransition, useEffect, useState } from "react";
import { getCoupons, createCoupon, deleteCoupon } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toNumber } from "@/lib/utils";

type Coupon = Awaited<ReturnType<typeof getCoupons>>[number];

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getCoupons().then(setCoupons);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">الكوبونات</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>إضافة كوبون</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                await createCoupon(fd);
                setCoupons(await getCoupons());
                e.currentTarget.reset();
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="code">الكود</Label>
              <Input id="code" name="code" required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountType">نوع الخصم</Label>
              <Select id="discountType" name="discountType" defaultValue="PERCENT">
                <option value="PERCENT">نسبة مئوية</option>
                <option value="FIXED">مبلغ ثابت</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">قيمة الخصم</Label>
              <Input id="discountValue" name="discountValue" type="number" min="0" required />
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={pending}>إضافة</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {coupons.map((coupon) => (
          <Card key={coupon.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="font-mono font-medium" dir="ltr">{coupon.code}</span>
                <Badge variant={coupon.isActive ? "success" : "outline"} className="ms-2">
                  {coupon.isActive ? "نشط" : "معطل"}
                </Badge>
                <p className="text-sm text-muted mt-1">
                  {coupon.discountType === "PERCENT"
                    ? `${toNumber(coupon.discountValue)}%`
                    : `${toNumber(coupon.discountValue)} ر.س`}
                  {" · "}استخدام: {coupon.usedCount}
                  {coupon.maxUses ? `/${coupon.maxUses}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    await deleteCoupon(coupon.id);
                    setCoupons(await getCoupons());
                  })
                }
              >
                حذف
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
