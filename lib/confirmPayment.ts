import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { sendOrderEmailWithInvoice } from "@/lib/invoice/email";
import { orderConfirmationEmail } from "@/lib/emailTemplates";
import { issueLicenses, createServiceRequests } from "@/lib/delivery/issueLicenses";
import { deliveryEmail } from "@/lib/delivery/deliveryEmail";
import { notifyNewOrder } from "@/lib/notifications/newOrder";

/**
 * Applies the side effects of a confirmed payment. Called from the browser
 * callback (/verify) and the gateway webhook — either may fire first, both
 * usually fire, and for Razorpay the webhook fires twice
 * (`payment.captured` and `order.paid`).
 *
 * IDEMPOTENCY — read this before changing anything here.
 *
 * The retail original guarded with `findById` → `if (paymentStatus ===
 * "paid") return` → `save()`. That is a read-check-write across three
 * awaits, so two concurrent webhook deliveries can both read "pending" and
 * both proceed. With physical goods that cost you a double stock
 * decrement. Once this function starts minting licences and sending
 * delivery emails in Phase 4, it costs you two licence keys and two emails
 * for one payment.
 *
 * So the transition is a single atomic findOneAndUpdate with
 * `paymentStatus: "pending"` in the filter. Exactly one caller gets a
 * document back; every other caller gets null and returns early. Everything
 * after that line runs once.
 */

export interface ConfirmResult {
  ok: boolean;
  alreadyProcessed?: boolean;
  orderId?: string;
  licensesIssued?: number;
  error?: string;
}

export async function confirmPayment(
  orderId: string,
  payment: {
    gateway: "razorpay" | "stripe";
    razorpayPaymentId?: string;
    stripePaymentIntentId?: string;
  }
): Promise<ConfirmResult> {
  await connectDB();

  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: "paid",
        orderStatus: "completed",
        paidAt: new Date(),
        gateway: payment.gateway,
        ...(payment.razorpayPaymentId
          ? { razorpayPaymentId: payment.razorpayPaymentId }
          : {}),
        ...(payment.stripePaymentIntentId
          ? { stripePaymentIntentId: payment.stripePaymentIntentId }
          : {}),
      },
    },
    { new: true }
  );

  if (!order) {
    // Either the order doesn't exist, or another delivery of the same event
    // won the race and has already handled it. Both are fine; the caller
    // should acknowledge the webhook either way so the gateway stops
    // retrying.
    const exists = await Order.exists({ _id: orderId });
    return exists
      ? { ok: true, alreadyProcessed: true, orderId }
      : { ok: false, error: "Order not found" };
  }

  // Spend the coupon only now. A coupon shouldn't be consumed by a checkout
  // the buyer abandoned at the payment screen.
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
  }

  /*
   * Delivery. Ordering matters: entitlements are created before anything is
   * sent, so an email can never promise a licence that doesn't exist.
   *
   * If issuing throws, it throws out of this function and the webhook
   * returns non-2xx so the gateway retries. A paid order with no licence
   * must not be quietly acknowledged — that is the one failure the customer
   * notices immediately and we would never see.
   */
  const licenses = await issueLicenses(order);
  await createServiceRequests(order);

  try {
    const customer = await User.findById(order.user);
    const to = order.billing?.email || customer?.email;
    if (to) {
      await sendOrderEmailWithInvoice({
        orderId: order._id.toString(),
        to,
        subject: `Order confirmed — ${order.orderNumber}`,
        html: orderConfirmationEmail(order as never),
      });
    }
  } catch (error) {
    // A mail failure must never un-confirm a payment. Log it and move on;
    // the buyer can download the invoice from their dashboard.
    console.error("[confirmPayment] confirmation email failed:", error);
  }

  // Delivery email, sent separately from the invoice email on purpose. They
  // answer different questions ("what did I pay" vs "where is my file"), and
  // if the invoice PDF fails to build, the customer must still be told how
  // to get what they bought.
  try {
    const to = order.billing?.email;
    if (to && licenses.length) {
      await sendEmail({
        to,
        subject: `Your licence ${licenses.length === 1 ? "key" : "keys"} — ${order.orderNumber}`,
        html: deliveryEmail({
          customerName: order.billing?.name ?? "there",
          orderNumber: order.orderNumber,
          licenses,
          serviceCount: order.addons?.length ?? 0,
        }),
      });
    }
  } catch (error) {
    console.error("[confirmPayment] delivery email failed:", error);
  }

  // Tell the team. Last, and fire-and-forget: notifyNewOrder swallows its
  // own failures, but the await is still wrapped so a change there can never
  // reach back into a confirmed payment.
  try {
    await notifyNewOrder({
      orderNumber: order.orderNumber,
      customerName: order.billing?.name ?? "Customer",
      total: order.total,
      currency: order.currency ?? "INR",
      itemTitles: order.items.map((item: { title: string }) => item.title),
      addonLabels: (order.addons ?? []).map(
        (addon: { label: string }) => addon.label
      ),
      country: order.billing?.country ?? "IN",
    });
  } catch (error) {
    console.error("[confirmPayment] order notification failed:", error);
  }

  return {
    ok: true,
    orderId: order._id.toString(),
    licensesIssued: licenses.length,
  };
}
