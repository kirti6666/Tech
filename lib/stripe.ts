import Stripe from "stripe";

/**
 * Stripe, for buyers outside India.
 *
 * Razorpay handles rupee payments; Stripe handles everything else. The split
 * is by billing country, decided at checkout, and both gateways converge on
 * the same confirmPayment() so there is one delivery path rather than two.
 *
 * ON CURRENCY: prices are authored in INR and converted to USD here at a
 * rate you control, not at a live market rate.
 *
 * A live FX feed sounds better and is worse. It makes your listed price
 * change between the moment a buyer opens the page and the moment they pay,
 * it introduces a third-party API into the checkout path, and it leaves you
 * exposed on refunds — you refund in USD at today's rate what you received
 * at last month's. A manually set rate with a margin is boring, predictable,
 * and lets you decide how much FX risk you carry.
 *
 * Review USD_PER_INR when the rate moves more than a few percent. Set it
 * slightly conservative: the margin covers Stripe's higher international
 * fees and the spread on settlement.
 */

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey && process.env.NODE_ENV === "production") {
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set — international checkout will fail."
  );
}

/**
 * No explicit apiVersion. Pinning one couples this file to whichever
 * version the installed SDK was built against — upgrade the package and the
 * build breaks on a string mismatch. The SDK's default always matches the
 * SDK, which is what you want; pin the package version in package.json
 * instead, where version management belongs.
 */
let stripeClient: Stripe | null = null;

/**
 * Construct Stripe only when a real key exists. Newer Stripe SDKs validate
 * the key in their constructor, so a placeholder makes builds fail even
 * when the Stripe route is never used.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient ??= new Stripe(key, { typescript: true });
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
  );
}

/** Rupees per US dollar. Set deliberately; see the note above. */
const INR_PER_USD = Number(process.env.INR_PER_USD ?? 88);

/**
 * Converts an INR amount to USD cents for Stripe.
 *
 * Rounds UP to the nearest whole dollar. Partly so prices read as $1,199
 * rather than $1,198.63, partly because rounding down repeatedly is a slow
 * leak you never notice.
 */
export function inrToUsdCents(amountInr: number): number {
  const dollars = Math.ceil(amountInr / INR_PER_USD);
  return dollars * 100;
}

export function inrToUsd(amountInr: number): number {
  return Math.ceil(amountInr / INR_PER_USD);
}

/**
 * Stripe's zero-decimal currency list doesn't include USD, so amounts are in
 * cents. Kept as a named helper so the ×100 is never written inline and
 * mistaken for a rupees-to-paise conversion elsewhere in the codebase.
 */
export function usdToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
