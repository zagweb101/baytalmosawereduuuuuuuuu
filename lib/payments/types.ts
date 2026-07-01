export type PaymentResult =
  | { success: true; providerRef: string }
  | { success: false; error: string };

export type RefundResult =
  | { success: true; refundRef: string }
  | { success: false; error: string };

export type CheckoutResult =
  | { type: "instant"; payment: PaymentResult }
  | { type: "redirect"; url: string };

export type PaymentProviderName = "mock" | "stripe";
