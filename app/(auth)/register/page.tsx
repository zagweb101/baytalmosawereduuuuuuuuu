"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerStudent } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="text-2xl text-center">إنشاء حساب</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError("");
            setMessage("");
            startTransition(async () => {
              const result = await registerStudent(fd);
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
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" required dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" name="password" type="password" required dir="ltr" />
            <p className="text-xs text-muted">8 أحرف على الأقل، حرف كبير ورقم</p>
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Button type="submit" loading={pending} className="w-full">
            تسجيل
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          لديك حساب؟{" "}
          <Link href="/login" className="text-brand-magenta hover:underline">
            سجل الدخول
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
