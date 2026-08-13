import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { confirmPayment } from "@/lib/confirmPayment";

/**
 * POST /api/payments/stripe/webhook
 *
 * The only thing that confirms an international order. The browser
 * returning to /order-success confirms nothing — same rule as Razorpay.
 *
 * THREE THINGS THAT ARE EASY TO GET WRONG HERE:
 *
 * 1. The signature must be verified against the RAW body. Next.js gives
 *    parsed JSON from req.json(), and re-serialising it changes key order
 *    and whitespace, so every signature check fails. req.text() first,
 *    always.
 *
 * 2. `checkout.session.completed` fires when the session completes, which
 *    for most methods means paid — but for delayed methods it does not.
 *    payment_status is checked explicitly rather than assumed.
 *
 * 3. Return 2xx for anything already handled. Stripe retries non-2xx for
 *    days, and a webhook that errors on a duplicate turns one payment into
 *    a retry storm. confirmPayment is idempotent; this handler just has to
 *    not fight it.
 */

export const dynamic = "force-dynamic";
// Stripe needs the unmodified body; the Node runtime gives us that reliably.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    // A bad signature means the request didn't come from Stripe. 400, and
    // deliberately no detail in the response.
    console.error("[stripe webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== "paid") {
          // Delayed payment method — the money isn't there yet. Acknowledge
          // and wait for async_payment_succeeded rather than delivering
          // source code against a pending bank transfer.
          console.log(
            `[stripe webhook] session ${session.id} completed but unpaid (${session.payment_status}) — waiting.`
          );
          return NextResponse.json({ received: true });
        }

        await handlePaid(session);
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        await handlePaid(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn(
          `[stripe webhook] delayed payment failed for order ${session.metadata?.orderId}`
        );
        break;
      }

      case "charge.refunded": {
        // Recorded, not acted on. Revocation is a deliberate admin action
        // with a written reason — see /api/admin/orders/[id]/refund. Wiring
        // it to fire automatically here would revoke a customer's access on
        // a partial refund you issued for a service, which is not what you
        // meant.
        const charge = event.data.object as Stripe.Charge;
        console.warn(
          `[stripe webhook] refund on charge ${charge.id} — revoke access in the admin panel if this is a full refund.`
        );
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[stripe webhook] handling ${event.type} failed:`, error);
    // Non-2xx so Stripe retries — a paid order that failed to deliver must
    // get another attempt.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

async function handlePaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;

  if (!orderId) {
    // Nothing to reconcile against. Log loudly and return 2xx anyway —
    // retrying won't add the metadata that isn't there.
    console.error(
      `[stripe webhook] session ${session.id} has no orderId. Reconcile manually.`
    );
    return;
  }

  const result = await confirmPayment(orderId, {
    gateway: "stripe",
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
  });

  if (!result.ok) {
    throw new Error(`confirmPayment failed for order ${orderId}: ${result.error}`);
  }

  if (result.alreadyProcessed) {
    console.log(`[stripe webhook] order ${orderId} already delivered.`);
  }
}
