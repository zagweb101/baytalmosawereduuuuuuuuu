"use client";

import { useTransition, useEffect, useState } from "react";
import {
  suspendUser,
  activateUser,
  manageUsers,
  createUser,
  changeUserRole,
} from "@/lib/actions/admin";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserRole } from "@prisma/client";

type User = Awaited<ReturnType<typeof manageUsers>>[number];

const roleLabels: Record<UserRole, string> = {
  ADMIN: "مدير",
  INSTRUCTOR: "مدرب",
  STUDENT: "طالب",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const loadUsers = () => {
    startTransition(async () => {
      const data = await manageUsers({
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data);
    });
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">المستخدمون</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إنشاء مستخدم</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setMessage("");
              setError("");
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const result = await createUser(fd);
                if (result.success) {
                  setMessage(result.data.message);
                  e.currentTarget.reset();
                  loadUsers();
                } else {
                  setError(result.error);
                }
              });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">البريد</Label>
              <Input id="email" name="email" type="email" required dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">الدور</Label>
              <select
                id="role"
                name="role"
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                defaultValue="STUDENT"
              >
                <option value="STUDENT">طالب</option>
                <option value="INSTRUCTOR">مدرب</option>
                <option value="ADMIN">مدير</option>
              </select>
            </div>
            <Button type="submit" loading={pending}>إنشاء</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
        >
          <option value="">كل الأدوار</option>
          <option value="STUDENT">طالب</option>
          <option value="INSTRUCTOR">مدرب</option>
          <option value="ADMIN">مدير</option>
        </select>
        <Button variant="outline" onClick={loadUsers} loading={pending}>
          تطبيق
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="text-start p-3">الاسم</th>
              <th className="text-start p-3">البريد</th>
              <th className="text-start p-3">الدور</th>
              <th className="text-start p-3">الحالة</th>
              <th className="text-start p-3">دورات / تسجيلات</th>
              <th className="text-start p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border">
                <td className="p-3">{user.name}</td>
                <td className="p-3" dir="ltr">{user.email}</td>
                <td className="p-3">
                  <select
                    className="text-xs rounded border border-border bg-background px-2 py-1"
                    value={user.role}
                    disabled={pending}
                    onChange={(e) => {
                      const role = e.target.value as UserRole;
                      startTransition(async () => {
                        const result = await changeUserRole(user.id, role);
                        if (result.success) {
                          setMessage(result.data.message);
                          loadUsers();
                        } else {
                          setError(result.error);
                          loadUsers();
                        }
                      });
                    }}
                  >
                    {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                      <option key={r} value={r}>{roleLabels[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3"><UserStatusBadge status={user.status} /></td>
                <td className="p-3 text-muted">
                  {user._count.courses} / {user._count.enrollments}
                </td>
                <td className="p-3 flex flex-wrap gap-2">
                  {user.status === "ACTIVE" && user.role !== "ADMIN" && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await suspendUser(user.id);
                          loadUsers();
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
                          loadUsers();
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

      {message && <p className="text-green-600 text-sm">{message}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
