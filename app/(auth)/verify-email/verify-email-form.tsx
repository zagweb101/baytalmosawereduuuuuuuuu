"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "@/lib/actions/auth";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("رمز التحقق مفقود");
      return;
    }
    startTransition(async () => {
      const result = await verifyEmail(token);
      if (result.success) {
        setStatus("success");
        setMessage(result.data.message);
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    });
  }, [token]);

  return (
    <Card>
      <CardContent className="p-8 text-center">
        {status === "loading" && <LoadingSpinner />}
        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-green-600 mb-4">{message}</p>
            <Link href="/login">
              <Button>تسجيل الدخول</Button>
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600">{message}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
