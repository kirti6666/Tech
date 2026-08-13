import { NextRequest, NextResponse } from "next/server";

/**
 * The "Add to cart" button on the product page posts here as a plain HTML
 * form, so it works before hydration and without JavaScript. The cart
 * itself lives in the browser, so there is nothing to store server-side —
 * this hands the buyer to the checkout, which picks the product up from the
 * `add` parameter and merges it into the local cart.
 *
 * A 303 (not 302) is deliberate: it turns the POST into a GET, so a refresh
 * on the checkout page doesn't re-submit the form.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const productId = String(form.get("productId") ?? "");
  const target = productId
    ? `/checkout?add=${encodeURIComponent(productId)}`
    : "/checkout";

  return NextResponse.redirect(new URL(target, req.url), 303);
}
