"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InfrastructureStatus, ServiceStatus } from "@/lib/config/infrastructure";

function statusBadge(status: ServiceStatus | boolean) {
  if (status === true || status === "ready") {
    return <Badge variant="success">جاهز</Badge>;
  }
  if (status === "mock") {
    return <Badge variant="warning">تجريبي</Badge>;
  }
  return <Badge variant="danger">ناقص</Badge>;
}

function IssueList({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 text-sm text-muted">
      {issues.map((issue) => (
        <li key={issue}>• {issue}</li>
      ))}
    </ul>
  );
}

export function InfrastructureStatusCard({
  status,
  productionReady,
}: {
  status: InfrastructureStatus;
  productionReady: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>البنية التحتية</CardTitle>
        {productionReady ? (
          <Badge variant="success">جاهز للإطلاق التجاري</Badge>
        ) : (
          <Badge variant="warning">إطلاق تجريبي</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">المصادقة</p>
            <IssueList issues={status.auth.issues} />
          </div>
          {statusBadge(status.auth.ready)}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">الدفع ({status.payments.provider})</p>
            <IssueList issues={status.payments.issues} />
          </div>
          {statusBadge(status.payments.status)}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">البريد</p>
            <IssueList issues={status.email.issues} />
          </div>
          {statusBadge(status.email.status)}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">التخزين السحابي</p>
            <IssueList issues={status.storage.issues} />
          </div>
          {statusBadge(status.storage.status)}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">رابط الموقع</p>
            {status.site.url && (
              <p className="text-sm text-muted mt-1 break-all">{status.site.url}</p>
            )}
            <IssueList issues={status.site.issues} />
          </div>
          {statusBadge(status.site.issues.length === 0)}
        </div>

        <p className="text-xs text-muted border-t border-border pt-4">
          Stripe webhook: <code className="text-xs">/api/webhooks/stripe</code>
          {" · "}
          فحص الصحة: <code className="text-xs">/api/health</code>
        </p>
      </CardContent>
    </Card>
  );
}
