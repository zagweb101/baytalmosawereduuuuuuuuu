"use client";

import { useTransition } from "react";
import { suspendUser, activateUser, manageUsers } from "@/lib/actions/admin";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

type User = Awaited<ReturnType<typeof manageUsers>>[number];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    manageUsers().then(setUsers);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">المستخدمون</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="text-start p-3">الاسم</th>
              <th className="text-start p-3">البريد</th>
              <th className="text-start p-3">الدور</th>
              <th className="text-start p-3">الحالة</th>
              <th className="text-start p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border">
                <td className="p-3">{user.name}</td>
                <td className="p-3" dir="ltr">{user.email}</td>
                <td className="p-3"><Badge variant="outline">{user.role}</Badge></td>
                <td className="p-3"><UserStatusBadge status={user.status} /></td>
                <td className="p-3">
                  {user.status === "ACTIVE" && user.role !== "ADMIN" && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await suspendUser(user.id);
                          setUsers(await manageUsers());
                        })
                      }
                    >
                      تعليق
                    </Button>
                  )}
                  {user.status === "SUSPENDED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await activateUser(user.id);
                          setUsers(await manageUsers());
                        })
                      }
                    >
                      تفعيل
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
