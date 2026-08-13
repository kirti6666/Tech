import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { getStripe, inrToUsd, usdToCents, isStripeConfigured } from "@/lib/stripe";

/**
 * POST /api/payments/stripe/create-session
 *
 * Mirrors the Razorpay create-order route exactly: it takes an order that
 * /api/orders already priced, and opens a payment session against the
 * stored total. No re-pricing here either — one calculation, in
 * lib/pricing.ts, or the two gateways drift apart.
 *
 * Line items are itemised rather than sent as one lump. Stripe shows them
 * on the hosted page and on the receipt, and a buyer approving a $1,400
 * charge should see what the $170 of it labelled "Rebranding" is for.
 *
 * GST is not added for these orders. A supply to a recipient outside India
 * is a zero-rated export of services, which lib/pricing.ts already handled
 * when it computed the total — this route just charges what was computed.
 */
export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isStripeConfigured()) {
    console.error("[stripe] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET missing.");
    return NextResponse.json(
      { error: "International payments are temporarily unavailable." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "International payments are temporarily unavailable." },
      { status: 503 }
    );
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This order has already been paid" },
        { status: 409 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "";

    const lineItems = [
      ...order.items.map((item: { title: string; price: number }) => ({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: usdToCents(inrToUsd(item.price)),
          product_data: { name: item.title },
        },
      })),
      ...order.addons.map((addon: { label: string; price: number }) => ({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: usdToCents(inrToUsd(addon.price)),
          product_data: { name: addon.label },
        },
      })),
    ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: order.billing.email,
      client_reference_id: order._id.toString(),
      // The webhook reads orderId from here. client_reference_id alone would
      // do, but metadata survives more of Stripe's object shapes and costs
      // nothing to set.
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
      payment_intent_data: {
        metadata: { orderId: order._id.toString() },
      },
      success_url: `${baseUrl}/order-success?order=${order.orderNumber}`,
      cancel_url: `${baseUrl}/checkout`,
      // Stripe collects the address again for its own fraud checks; ours is
      // already on the order and is what the invoice uses.
      billing_address_collection: "auto",
    });

    order.stripeSessionId = session.id;
    order.gateway = "stripe";
    order.currency = "USD";
    await order.save();

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe create-session failed:", error);
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 500 }
    );
  }
}
