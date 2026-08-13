import Razorpay from "razorpay";

/**
 * Razorpay client, constructed on first use rather than at import.
 *
 * The original built the client at module scope. The Razorpay SDK throws
 * from its constructor when `key_id` is missing, and Next.js imports every
 * route module during `next build` to collect page data — so a project
 * without Razorpay keys in the build environment failed the entire build
 * with "`key_id` or `oauthToken` is mandatory", pointing at a route file
 * rather than at the missing variable.
 *
 * That matters beyond local convenience: CI, preview deployments and any
 * environment that legitimately has no live payment keys could not build.
 * Deferring construction means a missing key breaks the payment request it
 * belongs to, with a message naming the actual problem, and leaves the rest
 * of the site building and running.
 *
 * The proxy keeps the default export callable as before (`razorpay.orders
 * .create(...)`), so no call site changes.
 */

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set before taking payments."
    );
  }

  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return client;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Lazy stand-in for the old eager instance. Property access constructs the
 * real client, so existing imports keep working unchanged.
 */
const razorpay = new Proxy({} as Razorpay, {
  get(_target, property, receiver) {
    return Reflect.get(getRazorpay(), property, receiver);
  },
});

export default razorpay;
