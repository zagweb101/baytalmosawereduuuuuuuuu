"use client";

import { useTransition } from "react";
import { revokeSession, revokeOtherSessions } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Session = {
  id: string;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  createdAt: Date;
};

type UserSessionsProps = {
  sessions: Session[];
};

export function UserSessions({ sessions }: UserSessionsProps) {
  const [pending, startTransition] = useTransition();

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg">الجلسات النشطة</CardTitle>
        {sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                await revokeOtherSessions();
                window.location.reload();
              })
            }
          >
            إنهاء الجلسات الأخرى
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((session, index) => (
          <div
            key={session.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {session.deviceType ?? "جهاز"}
                {index === 0 && (
                  <span className="ms-2 text-xs text-brand-purple">
                    (الحالية)
                  </span>
                )}
              </p>
              <p className="text-muted text-xs mt-1">
                {session.ipAddress ?? "IP غير معروف"} · آخر نشاط:{" "}
                {formatDate(session.lastActiveAt)}
              </p>
            </div>
            {index > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(async () => {
                    await revokeSession(session.id);
                    window.location.reload();
                  })
                }
              >
                إنهاء
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
