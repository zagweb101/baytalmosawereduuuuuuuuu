"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { updateProfile } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSessions } from "@/components/shared/user-sessions";

type Session = {
  id: string;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  createdAt: Date;
};

type ProfilePageProps = {
  user: {
    name: string;
    email: string;
    bio: string | null;
    role: string;
  };
  sessions: Session[];
};

export default function ProfilePage({ user, sessions }: ProfilePageProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-8">الملف الشخصي</h1>
      <Card>
        <CardHeader>
          <CardTitle>معلومات الحساب</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setError("");
              startTransition(async () => {
                const result = await updateProfile(fd);
                if (result.success) {
                  setMessage(result.data.message);
                } else {
                  setError(result.error);
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={user.email} disabled dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">نبذة</Label>
              <Textarea id="bio" name="bio" defaultValue={user.bio ?? ""} rows={3} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <Button type="submit" loading={pending}>
              حفظ التغييرات
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
      <UserSessions sessions={sessions} />
    </div>
  );
}
