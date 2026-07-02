"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/lib/actions/login";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const urlError = searchParams.get("error");
  const [error, setError] = useState(() => {
    if (urlError === "account_blocked") {
      return "تم تعليق حسابك. تواصل مع الدعم.";
    }
    if (urlError === "pending_instructor") {
      return "حساب المدرب قيد المراجعة. سيتم إشعارك عند الموافقة.";
    }
    return "";
  });
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="text-2xl text-center">تسجيل الدخول</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError("");
            startTransition(async () => {
              const result = await loginUser(
                String(fd.get("email")),
                String(fd.get("password")),
              );
              if (!result.success) {
                setError(result.error);
              } else {
                router.push(callbackUrl);
                router.refresh();
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" required dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" name="password" type="password" required dir="ltr" />
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          <Button type="submit" loading={pending} className="w-full">
            دخول
          </Button>
        </form>
        <div className="mt-4 text-center text-sm space-y-2">
          <Link href="/forgot-password" className="text-brand-magenta hover:underline">
            نسيت كلمة المرور؟
          </Link>
          <p className="text-muted">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-brand-magenta hover:underline">
              سجل الآن
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
