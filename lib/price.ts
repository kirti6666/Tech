/**
 * Indian-grouped currency formatting: ₹1,19,999, not ₹119,999.
 *
 * Always whole rupees — these are five- and six-figure prices and the paise
 * are noise. `Intl` handles the lakh grouping; do not hand-roll it.
 */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number, currency: "INR" | "USD" = "INR") {
  return currency === "USD" ? usd.format(amount) : inr.format(amount);
}

/** Discount as a whole percentage, for the "Save 20%" tag. */
export function discountPercent(price: number, discountPrice?: number) {
  if (!discountPrice || discountPrice >= price) return null;
  return Math.round(((price - discountPrice) / price) * 100);
}
