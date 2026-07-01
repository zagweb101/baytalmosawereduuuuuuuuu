import { NextResponse } from "next/server";
import {
  getOrderIdFromCheckoutSession,
  verifyStripeWebhook,
} from "@/lib/payments/stripe-provider";
import { fulfillPaidOrder } from "@/lib/services/fulfill-order";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "توقيع مفقود" }, { status: 400 });
  }

  const body = await request.text();

  try {
    const event = verifyStripeWebhook(body, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = getOrderIdFromCheckoutSession(session);

      if (orderId && session.payment_status === "paid") {
        await fulfillPaidOrder(orderId, session.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطأ في webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
