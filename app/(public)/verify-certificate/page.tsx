"use client";

import { useState, useTransition } from "react";
import { verifyCertificate } from "@/lib/actions/certificates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Award, CheckCircle, XCircle } from "lucide-react";

export default function VerifyCertificatePage() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    valid: boolean;
    studentName?: string;
    courseTitle?: string;
    issuedAt?: Date;
  } | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className="text-center mb-8">
        <Award className="h-12 w-12 mx-auto mb-4 text-brand-magenta" />
        <h1 className="text-3xl font-bold">التحقق من الشهادة</h1>
        <p className="text-muted mt-2">أدخل رقم الشهادة للتحقق من صحتها</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const number = String(fd.get("certificateNumber"));
              setError("");
              setResult(null);
              startTransition(async () => {
                const res = await verifyCertificate(number);
                if (res.success) {
                  setResult(res.data);
                } else {
                  setError(res.error);
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">رقم الشهادة</Label>
              <Input
                id="certificateNumber"
                name="certificateNumber"
                placeholder="BM-XXXXXXXX-XXXXXXXX"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" loading={pending} className="w-full mt-4">
              تحقق
            </Button>
          </form>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${result.valid ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
              {result.valid ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <p className="text-center font-semibold text-green-800 dark:text-green-400">
                    شهادة صالحة
                  </p>
                  <div className="text-sm space-y-1 text-center">
                    <p>الطالب: {result.studentName}</p>
                    <p>الدورة: {result.courseTitle}</p>
                    {result.issuedAt && (
                      <p>تاريخ الإصدار: {formatDate(result.issuedAt)}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-red-800 dark:text-red-400">
                    الشهادة غير موجودة
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
