"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/price";
import type { Quote } from "@/lib/pricing";
import { AvailableCoupons } from "@/components/storefront/AvailableCoupons";

/**
 * The money column.
 *
 * The GST split is shown as CGST and SGST separately when it applies,
 * because that is how it appears on the invoice and a buyer reconciling the
 * two shouldn't have to work out that ₹5,400 of "GST" was two ₹2,700 halves.
 *
 * Export orders get an explicit line saying no GST is charged and why.
 * Silently showing ₹0 tax on an international order reads like a bug.
 */
export function OrderSummary({
  quote,
  couponCode,
  onApplyCoupon,
  busy,
}: {
  quote: Quote | null;
  couponCode: string;
  onApplyCoupon: (code: string) => void;
  busy?: boolean;
}) {
  const [code, setCode] = useState(couponCode);

  function applyCoupon(nextCode: string) {
    const normalized = nextCode.trim().toUpperCase();
    setCode(normalized);
    onApplyCoupon(normalized);
  }

  if (!quote) {
    return (
      <div className="card p-4 sm:p-5">
        <p className="label-muted">Working out your total…</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-rule-soft px-4 py-3 sm:px-5 sm:py-4">
        <p className="label">Secure payment</p>
        <h2 className="mt-0.5 text-lg font-bold text-ink">Payment summary</h2>
      </div>

      <div className="space-y-1.5 p-4 text-sm sm:space-y-2 sm:p-5">
        <Row label="Products" value={formatPrice(quote.subtotal)} />
        {quote.addonTotal > 0 && (
          <Row label="Services" value={formatPrice(quote.addonTotal)} />
        )}
        {quote.discount > 0 && (
          <Row
            label={`Discount${quote.couponCode ? ` (${quote.couponCode})` : ""}`}
            value={`− ${formatPrice(quote.discount)}`}
            tone="save"
          />
        )}

        <div className="border-t border-rule-soft pt-2">
          <Row label="Taxable value" value={formatPrice(quote.taxableValue)} muted />
          {quote.taxTreatment === "intra_state" && (
            <>
              <Row label="CGST" value={formatPrice(quote.cgst)} muted />
              <Row label="SGST" value={formatPrice(quote.sgst)} muted />
            </>
          )}
          {quote.taxTreatment === "inter_state" && (
            <Row label="IGST" value={formatPrice(quote.igst)} muted />
          )}
          {quote.taxTreatment === "export" && (
            <p className="py-1 text-xs leading-relaxed text-ink-soft">
              No GST charged. This is an export of services, zero-rated under
              Letter of Undertaking.
            </p>
          )}
        </div>

        <div className="flex items-baseline justify-between border-t border-rule pt-2.5 sm:pt-3">
          <span className="font-display text-base font-semibold text-ink">
            Total
          </span>
          <span className="tabular text-xl font-medium text-ink tabular">
            {formatPrice(quote.total)}
          </span>
        </div>
      </div>

      <div className="border-t border-rule p-3.5 sm:p-4">
        <label className="label-muted" htmlFor="coupon">
          Coupon code
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="coupon"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && applyCoupon(code)}
            placeholder="Enter code"
          className="field tabular uppercase placeholder:normal-case"
          />
          <button
            type="button"
            onClick={() => applyCoupon(code)}
            disabled={busy}
            className="shrink-0 btn-secondary disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        {quote.couponError && (
          <p className="mt-1.5 text-xs text-accent-deep">{quote.couponError}</p>
        )}
        {quote.couponCode && !quote.couponError && (
          <p className="mt-1.5 text-xs text-save">
            {quote.couponCode} applied — {formatPrice(quote.discount)} off.
          </p>
        )}
        <AvailableCoupons subtotal={quote.subtotal} appliedCode={quote.couponCode ?? couponCode} onApply={applyCoupon} busy={busy} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  tone,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tone?: "save";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className={muted ? "text-xs text-ink-faint" : "text-ink-soft"}>
        {label}
      </span>
      <span
        className={`tabular tabular ${
          tone === "save" ? "text-save" : muted ? "text-xs text-ink-faint" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
