"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { enrollFree } from "@/lib/actions/enrollments";
import { createOrder, processPayment, getPaymentProvider } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EnrollButtonProps = {
  courseId: string;
  slug: string;
  isFree: boolean;
  isEnrolled: boolean;
  isLoggedIn: boolean;
};

export function EnrollButton({
  courseId,
  slug,
  isFree,
  isEnrolled,
  isLoggedIn,
}: EnrollButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [provider, setProvider] = useState<"mock" | "stripe">("mock");

  useEffect(() => {
    if (showPayment) {
      getPaymentProvider().then(setProvider);
    }
  }, [showPayment]);

  if (isEnrolled) {
    return (
      <Button onClick={() => router.push(`/dashboard/courses/${courseId}/learn`)}>
        متابعة التعلم
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button onClick={() => router.push(`/login?callbackUrl=/courses/${slug}`)}>
        سجل الدخول للتسجيل
      </Button>
    );
  }

  if (isFree) {
    return (
      <div>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <Button
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await enrollFree(courseId);
              if (result.success) {
                router.push(`/dashboard/courses/${courseId}/learn`);
              } else {
                setError(result.error);
              }
            })
          }
        >
          التسجيل مجاناً
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!showPayment ? (
        <>
          <Input
            placeholder="كود الخصم (اختياري)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <Button
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                const fd = new FormData();
                fd.set("courseId", courseId);
                if (couponCode) fd.set("couponCode", couponCode);
                const result = await createOrder(fd);
                if (result.success) {
                  setOrderId(result.data.orderId);
                  setShowPayment(true);
                } else {
                  setError(result.error);
                }
              })
            }
          >
            شراء الدورة
          </Button>
        </>
      ) : (
        <Button
          loading={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await processPayment(orderId);
                if (result.success) {
                  if (result.data.checkoutUrl) {
                    window.location.href = result.data.checkoutUrl;
                    return;
                  }
                  router.push(`/dashboard/courses/${courseId}/learn`);
                } else {
                  setError(result.error);
                }
              })
            }
          >
            {provider === "stripe" ? "الدفع عبر Stripe" : "إتمام الدفع (تجريبي)"}
        </Button>
      )}
    </div>
  );
}
