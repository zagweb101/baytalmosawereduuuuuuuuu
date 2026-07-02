"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { forgotPassword, resetPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h1" className="text-2xl text-center">إعادة تعيين كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setError("");
              startTransition(async () => {
                const result = await resetPassword(token, fd);
                if (result.success) {
                  setMessage(result.data.message);
                } else {
                  setError(result.error);
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <Input id="password" name="password" type="password" required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required dir="ltr" />
            </div>
            {error && <Alert variant="error">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
            <Button type="submit" loading={pending} className="w-full">
              حفظ
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="text-2xl text-center">نسيت كلمة المرور</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError("");
            startTransition(async () => {
              const result = await forgotPassword(fd);
              if (result.success) {
                setMessage(result.data.message);
              } else {
                setError(result.error);
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" name="email" type="email" required dir="ltr" />
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Button type="submit" loading={pending} className="w-full">
            إرسال رابط إعادة التعيين
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
