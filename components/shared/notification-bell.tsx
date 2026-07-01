"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

type Notification = Awaited<ReturnType<typeof getMyNotifications>>[number];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [pending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const [items, count] = await Promise.all([
        getMyNotifications(15),
        getUnreadNotificationCount(),
      ]);
      setNotifications(items);
      setUnread(count);
    });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -start-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-magenta px-1 text-[10px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-semibold text-sm">الإشعارات</span>
              {unread > 0 && (
                <button
                  type="button"
                  className="text-xs text-brand-purple hover:underline"
                  onClick={() =>
                    startTransition(async () => {
                      await markAllNotificationsRead();
                      load();
                    })
                  }
                >
                  تعليم الكل كمقروء
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted text-center">
                  لا توجد إشعارات
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "border-b border-border px-4 py-3 text-sm last:border-0",
                      !n.isRead && "bg-brand-purple/5",
                    )}
                  >
                    {n.link ? (
                      <Link
                        href={n.link}
                        className="block hover:text-brand-purple"
                        onClick={() => {
                          if (!n.isRead) {
                            markNotificationRead(n.id).then(load);
                          }
                          setOpen(false);
                        }}
                      >
                        <p className="font-medium">{n.title}</p>
                        <p className="text-muted text-xs mt-0.5">{n.body}</p>
                      </Link>
                    ) : (
                      <div
                        onClick={() => {
                          if (!n.isRead) {
                            markNotificationRead(n.id).then(load);
                          }
                        }}
                      >
                        <p className="font-medium">{n.title}</p>
                        <p className="text-muted text-xs mt-0.5">{n.body}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-muted mt-1">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
