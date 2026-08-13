import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { revokeOrderAccess } from "@/lib/delivery/revokeOrderAccess";

/**
 * POST /api/admin/orders/[id]/refund — revokes every entitlement the order
 * granted and marks it refunded.
 *
 * It does NOT move money. Refunds are issued from the Razorpay or Stripe
 * dashboard, and this records the consequence. Keeping the two separate is
 * deliberate: a bug here can't accidentally pay money out, and a refund
 * issued directly in the gateway still gets recorded when someone runs this.
 *
 * The response reports GitHub failures explicitly rather than swallowing
 * them. If repository access couldn't be removed, whoever pressed the button
 * needs to know while they're still looking at the screen — that's the one
 * part of a revocation that silently leaves the door open.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await req.json();
    const reason = String(body.reason ?? "").trim();
    if (!reason) {
      return NextResponse.json(
        { error: "A reason is required — it goes on the licence record" },
        { status: 400 }
      );
    }

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.paymentStatus === "refunded") {
      return NextResponse.json(
        { error: "This order has already been refunded" },
        { status: 409 }
      );
    }

    const result = await revokeOrderAccess(params.id, { reason, byUserId: admin.id });

    return NextResponse.json({
      ok: true,
      ...result,
      warning: result.githubFailures.length
        ? "Some GitHub access could not be removed — remove it manually."
        : undefined,
    });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/refund failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
