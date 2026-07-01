"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { becomeInstructor } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BecomeInstructorPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">انضم كمدرب</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError("");
            startTransition(async () => {
              const result = await becomeInstructor(fd);
              if (result.success) {
                setMessage(result.data.message);
              } else {
                setError(result.error);
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="bio">نبذة عن خبرتك</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="اكتب عن خبرتك في التصوير والتعليم..."
              required
              rows={5}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}
          <Button type="submit" loading={pending} className="w-full">
            إرسال الطلب
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
