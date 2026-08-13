"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useCartStore, toQuoteItems } from "@/store/useCartStore";
import { CartLines } from "@/components/storefront/checkout/CartLines";
import {
  BillingForm,
  EMPTY_BILLING,
  type BillingDetails,
} from "@/components/storefront/checkout/BillingForm";
import { OrderSummary } from "@/components/storefront/checkout/OrderSummary";
import type { Quote } from "@/lib/pricing";
import type { AddonOffer } from "@/lib/addons";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/**
 * Checkout.
 *
 * The total is never calculated here. Every change — ticking a service,
 * applying a coupon, changing the billing state — re-requests a quote from
 * the server, and the server is also what prices the order when it's
 * created. There is one calculation and the browser only displays it.
 *
 * The state field re-quotes because it moves the tax between CGST+SGST and
 * IGST. The amounts sum to the same total, but a buyer who sees the split
 * change after paying will think they were charged twice.
 */
export function CheckoutClient() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const toggleAddon = useCartStore((s) => s.toggleAddon);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const [billing, setBilling] = useState<BillingDetails>(EMPTY_BILLING);
  const [couponCode, setCouponCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [addons, setAddons] = useState<AddonOffer[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [paying, setPaying] = useState(false);

  // Guards against an older quote landing after a newer one and overwriting
  // it — easy to hit when someone ticks two services quickly.
  const requestId = useRef(0);

  const refreshQuote = useCallback(async () => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    const id = ++requestId.current;
    setQuoting(true);
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: toQuoteItems(items),
          couponCode,
          country: billing.country,
          state: billing.state,
        }),
      });
      const data = await response.json();
      if (id !== requestId.current) return;
      if (!response.ok) {
        setFormError(data.error ?? "Could not price your order.");
        return;
      }
      setQuote(data.quote);
      setAddons(data.addons ?? []);
      setFormError(null);
    } catch {
      if (id === requestId.current) {
        setFormError("Could not reach the server. Check your connection and try again.");
      }
    } finally {
      if (id === requestId.current) setQuoting(false);
    }
  }, [items, couponCode, billing.country, billing.state]);

  useEffect(() => {
    void refreshQuote();
  }, [refreshQuote]);

  async function placeOrder() {
    setPaying(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toQuoteItems(items), couponCode, billing }),
      });
      const orderData = await orderResponse.json();

      if (orderResponse.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      if (!orderResponse.ok) {
        setFieldErrors(orderData.fields ?? {});
        setFormError(orderData.error ?? "Could not create your order.");
        return;
      }

      const paymentResponse = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.order._id }),
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok) {
        setFormError(payment.error ?? "Could not start the payment.");
        return;
      }

      if (!window.Razorpay) {
        setFormError("The payment window didn't load. Refresh the page and try again.");
        return;
      }

      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.razorpayOrderId,
        name: "TechBro",
        description: payment.orderNumber,
        prefill: payment.prefill,
        handler: () => {
          // Deliberately does nothing but navigate. The order is confirmed
          // server-side by the webhook, never by this callback — a browser
          // that never returns must not cost the buyer their purchase, and
          // a browser that lies must not create one.
          clearCart();
          router.push(`/order-success?order=${orderData.order.orderNumber}`);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      checkout.open();
    } catch {
      setFormError("Something went wrong starting the payment. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rule-lavender bg-paper-alt px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          Your cart is empty
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Pick a product and it will show up here.
        </p>
        <Link
          href="/shop"
          className="mt-5 inline-block btn-primary"
        >
          Browse the catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-7 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
      <div className="order-2 min-w-0 space-y-4 sm:space-y-6 lg:order-1">
        {quote?.warnings.map((warning) => (
          <p
            key={warning}
            className="rounded-lg bg-accent-wash px-4 py-3 text-sm text-ink"
          >
            {warning}
          </p>
        ))}

        <CartLines
          items={items}
          addons={addons}
          onToggleAddon={toggleAddon}
          onRemove={removeItem}
          busy={quoting || paying}
        />

        <BillingForm value={billing} errors={fieldErrors} onChange={setBilling} />
      </div>

      <aside className="order-1 space-y-3 lg:order-2 lg:sticky lg:top-24 lg:space-y-4">
        <OrderSummary
          quote={quote}
          couponCode={couponCode}
          onApplyCoupon={setCouponCode}
          busy={quoting}
        />

        {formError && (
          <p className="rounded-lg bg-accent-wash px-4 py-3 text-sm text-ink">
            {formError}
          </p>
        )}

        <div className="rounded-xl border border-rule bg-white p-3 shadow-sm sm:p-4">
          <button
            type="button"
            onClick={placeOrder}
            disabled={paying || quoting || !quote}
            className="btn-primary min-h-11 w-full text-sm disabled:opacity-60 sm:min-h-12 sm:text-base"
          >
            <LockKeyhole size={16} />
            {paying ? "Opening payment…" : "Pay securely and get licence"}
          </button>
          <div className="mt-2.5 flex items-start gap-2 text-[11px] leading-snug text-ink-faint sm:text-xs sm:leading-relaxed">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-save" />
            <p>Secure payment. Licence, download access and GST invoice are sent after confirmation.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
