import Stripe from "stripe";

export function isStripeEnabled(): boolean {
  return (
    process.env.PAYMENT_PROVIDER === "stripe" &&
    Boolean(process.env.STRIPE_SECRET_KEY)
  );
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY غير مضبوط");
  }
  return new Stripe(key);
}

export async function createStripeCheckout(params: {
  orderId: string;
  amount: number;
  courseTitle: string;
  courseSlug: string;
  studentEmail: string;
}): Promise<string> {
  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const amountHalalas = Math.round(params.amount * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.studentEmail,
    line_items: [
      {
        price_data: {
          currency: (process.env.STRIPE_CURRENCY ?? "sar").toLowerCase(),
          unit_amount: amountHalalas,
          product_data: {
            name: params.courseTitle,
            description: "دورة تعليمية — بيت المصور",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: params.orderId,
    },
    success_url: `${siteUrl}/dashboard/orders?paid=${params.orderId}`,
    cancel_url: `${siteUrl}/courses/${params.courseSlug}?cancelled=1`,
  });

  if (!session.url) {
    throw new Error("فشل إنشاء جلسة الدفع");
  }

  return session.url;
}

export async function refundStripePayment(
  providerRef: string,
  amount?: number,
): Promise<{ success: boolean; refundRef?: string; error?: string }> {
  try {
    const stripe = getStripe();

    if (providerRef.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(providerRef);
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      if (!paymentIntentId) {
        return { success: false, error: "لم يُعثر على عملية الدفع" };
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return { success: true, refundRef: refund.id };
    }

    const refund = await stripe.refunds.create({
      payment_intent: providerRef,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return { success: true, refundRef: refund.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "فشل استرداد Stripe";
    return { success: false, error: message };
  }
}

export function verifyStripeWebhook(
  body: string,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET غير مضبوط");
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}

export function getOrderIdFromCheckoutSession(
  session: Stripe.Checkout.Session,
): string | null {
  return session.metadata?.orderId ?? null;
}

export function getCheckoutAmount(session: Stripe.Checkout.Session): number {
  if (session.amount_total != null) {
    return session.amount_total / 100;
  }
  return 0;
}
