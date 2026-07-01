import type { DiscountType } from "@prisma/client";

export type PricingSettings = {
  vatPercent: number;
  commissionPercent: number;
};

export type CouponInput = {
  discountType: DiscountType;
  discountValue: number;
};

export type OrderAmounts = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  amount: number;
  commissionAmount: number;
  instructorNetAmount: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function applyCoupon(price: number, coupon?: CouponInput): number {
  if (!coupon) {
    return price;
  }

  if (coupon.discountType === "PERCENT") {
    return round(price * (1 - coupon.discountValue / 100));
  }

  return round(Math.max(0, price - coupon.discountValue));
}

export function calculateOrderAmounts(
  price: number,
  coupon?: CouponInput,
  settings: PricingSettings = { vatPercent: 15, commissionPercent: 20 },
): OrderAmounts {
  const subtotal = applyCoupon(price, coupon);
  const discountAmount = round(price - subtotal);
  const taxAmount = round(subtotal * (settings.vatPercent / 100));
  const amount = round(subtotal + taxAmount);
  const commissionAmount = round(
    subtotal * (settings.commissionPercent / 100),
  );
  const instructorNetAmount = round(subtotal - commissionAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    amount,
    commissionAmount,
    instructorNetAmount,
  };
}
