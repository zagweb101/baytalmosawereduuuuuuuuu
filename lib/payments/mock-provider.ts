export type PaymentResult =
  | {
      success: true;
      providerRef: string;
    }
  | {
      success: false;
      error: string;
    };

export type MockPaymentOptions = {
  fail?: boolean;
  delayMs?: number;
};

export async function processMockPayment(
  orderId: string,
  amount: number,
  options: MockPaymentOptions = {},
): Promise<PaymentResult> {
  const { fail = false, delayMs = 500 } = options;

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (fail) {
    return {
      success: false,
      error: "فشلت عملية الدفع. يرجى المحاولة مرة أخرى.",
    };
  }

  return {
    success: true,
    providerRef: `mock_${orderId}_${Date.now()}_${amount.toFixed(2)}`,
  };
}

export async function refundMockPayment(
  providerRef: string,
): Promise<{ success: boolean; refundRef?: string; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (providerRef.startsWith("mock_fail_refund")) {
    return { success: false, error: "فشل استرداد المبلغ" };
  }

  return {
    success: true,
    refundRef: `refund_${providerRef}_${Date.now()}`,
  };
}
