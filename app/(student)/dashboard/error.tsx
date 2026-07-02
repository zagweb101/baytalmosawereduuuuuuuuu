"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/monitoring";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest, boundary: "dashboard" });
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center space-y-4">
      <h2 className="text-xl font-bold">حدث خطأ غير متوقع</h2>
      <p className="text-muted">جرّب إعادة تحميل الصفحة.</p>
      <Button onClick={reset}>إعادة المحاولة</Button>
    </div>
  );
}
