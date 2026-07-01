"use client";

import { useTransition, useEffect, useState } from "react";
import {
  getInfrastructureStatusForAdmin,
  getPlatformSettings,
  updatePlatformSettings,
} from "@/lib/actions/settings";
import { InfrastructureStatusCard } from "@/components/shared/infrastructure-status-card";
import type { InfrastructureStatus } from "@/lib/config/infrastructure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toNumber } from "@/lib/utils";

type Settings = NonNullable<Awaited<ReturnType<typeof getPlatformSettings>>>;

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [infrastructure, setInfrastructure] = useState<{
    status: InfrastructureStatus;
    productionReady: boolean;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getPlatformSettings().then(setSettings);
    getInfrastructureStatusForAdmin().then(setInfrastructure);
  }, []);

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8 text-muted">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">إعدادات المنصة</h1>
      {infrastructure && (
        <InfrastructureStatusCard
          status={infrastructure.status}
          productionReady={infrastructure.productionReady}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle>الإعدادات العامة</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const result = await updatePlatformSettings(fd);
                if (result.success) {
                  setMessage(result.data.message);
                  setSettings(await getPlatformSettings());
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="siteName">اسم المنصة</Label>
              <Input id="siteName" name="siteName" defaultValue={settings.siteName} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionPercent">نسبة العمولة (%)</Label>
                <Input
                  id="commissionPercent"
                  name="commissionPercent"
                  type="number"
                  defaultValue={toNumber(settings.commissionPercent)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatPercent">ضريبة القيمة المضافة (%)</Label>
                <Input
                  id="vatPercent"
                  name="vatPercent"
                  type="number"
                  defaultValue={toNumber(settings.vatPercent)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFreePreviewLessons">معاينة مجانية (دروس)</Label>
                <Input
                  id="maxFreePreviewLessons"
                  name="maxFreePreviewLessons"
                  type="number"
                  defaultValue={settings.maxFreePreviewLessons}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refundDays">أيام الاسترداد</Label>
                <Input
                  id="refundDays"
                  name="refundDays"
                  type="number"
                  defaultValue={settings.refundDays}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refundMaxProgressPercent">حد التقدم للاسترداد (%)</Label>
                <Input
                  id="refundMaxProgressPercent"
                  name="refundMaxProgressPercent"
                  type="number"
                  defaultValue={settings.refundMaxProgressPercent}
                />
              </div>
            </div>
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <Button type="submit" loading={pending}>حفظ</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
