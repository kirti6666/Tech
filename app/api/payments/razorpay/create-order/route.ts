import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { requireAuth } from "@/lib/middleware/requireAuth";
import razorpay from "@/lib/razorpay";

/**
 * POST /api/payments/razorpay/create-order
 *
 * Takes an order that /api/orders already created and priced, and opens a
 * Razorpay order against it. It does NOT re-price anything.
 *
 * That's the important change from the retail version, which recomputed the
 * cart a second time here with its own copy of the coupon and shipping
 * logic. Two independent calculations of the same total is a bug waiting for
 * the day someone edits one of them — now the stored `order.total` is the
 * only number that reaches the gateway.
 */
export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    if (order.currency !== "INR") {
      return NextResponse.json(
        { error: "Razorpay handles rupee payments only — use the international checkout" },
        { status: 400 }
      );
    }

    // Reuse an existing Razorpay order if the buyer reloads the payment page.
    // Creating a second one leaves an orphan the reconciliation report will
    // ask questions about later.
    if (order.razorpayOrderId) {
      const existing = await razorpay.orders.fetch(order.razorpayOrderId);
      if (existing && existing.status === "created") {
        return NextResponse.json(buildResponse(order, existing));
      }
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // paise
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: order._id.toString(), orderNumber: order.orderNumber },
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.gateway = "razorpay";
    await order.save();

    return NextResponse.json(buildResponse(order, razorpayOrder));
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    console.error("Razorpay create-order failed:", error);

    if (err?.statusCode === 401) {
      return NextResponse.json(
        {
          error:
            "Payment gateway authentication failed — check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local, and restart the dev server after editing them.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function buildResponse(
  order: {
    _id: unknown;
    orderNumber: string;
    billing: { name: string; email: string; phone: string };
  },
  razorpayOrder: { id: string; amount: number | string; currency: string }
) {
  return {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    prefill: {
      name: order.billing.name,
      email: order.billing.email,
      contact: order.billing.phone,
    },
  };
}
