import type {
  CheckoutResult,
  PaymentProviderName,
  PaymentResult,
  RefundResult,
} from "@/lib/payments/types";
import {
  processMockPayment,
  refundMockPayment,
} from "@/lib/payments/mock-provider";
import { createStripeCheckout, isStripeEnabled } from "@/lib/payments/stripe-provider";

export function getPaymentProviderName(): PaymentProviderName {
  return isStripeEnabled() ? "stripe" : "mock";
}

export async function checkoutOrder(params: {
  orderId: string;
  amount: number;
  courseTitle: string;
  courseSlug: string;
  studentEmail: string;
}): Promise<CheckoutResult> {
  if (isStripeEnabled()) {
    const url = await createStripeCheckout(params);
    return { type: "redirect", url };
  }

  const payment = await processMockPayment(params.orderId, params.amount);
  return { type: "instant", payment };
}

export async function processProviderPayment(
  orderId: string,
  amount: number,
): Promise<PaymentResult> {
  return processMockPayment(orderId, amount);
}

export async function refundProviderPayment(
  providerRef: string,
): Promise<RefundResult> {
  const result = await refundMockPayment(providerRef);
  if (!result.success) {
    return { success: false, error: result.error ?? "فشل الاسترداد" };
  }
  return { success: true, refundRef: result.refundRef! };
}
