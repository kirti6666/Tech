import { NextRequest, NextResponse } from "next/server";
import { quoteOrder } from "@/lib/pricing";
import { getActiveAddons } from "@/lib/addons";

/**
 * POST /api/checkout/quote — priced breakdown for a cart.
 *
 * The checkout page calls this on every change: ticking an add-on, applying
 * a coupon, changing the billing state. That last one matters more than it
 * looks — the state determines CGST+SGST versus IGST, and a buyer who sees
 * the split change after they've paid will assume they were overcharged.
 *
 * Unauthenticated on purpose. It reads nothing user-specific and creates
 * nothing; forcing a login before the buyer can see the tax-inclusive total
 * loses orders. It should still be rate-limited (see Phase 8) since it does
 * hit the database.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const items = Array.isArray(body.items)
      ? body.items
          .filter((i: unknown): i is { productId: string } =>
            Boolean(i && typeof (i as { productId?: unknown }).productId === "string")
          )
          .slice(0, 20)
          .map((i: { productId: string; packageId?: unknown; addons?: unknown }) => ({
            productId: i.productId,
            packageId: typeof i.packageId === "string" ? i.packageId : undefined,
            addons: Array.isArray(i.addons)
              ? i.addons.filter((a): a is string => typeof a === "string")
              : [],
          }))
      : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const [quote, addons] = await Promise.all([
      quoteOrder({
        items,
        couponCode: typeof body.couponCode === "string" ? body.couponCode : undefined,
        billing: {
          country: typeof body.country === "string" ? body.country : "IN",
          state: typeof body.state === "string" ? body.state : undefined,
        },
      }),
      getActiveAddons(),
    ]);

    return NextResponse.json({ quote, addons });
  } catch (error) {
    console.error("POST /api/checkout/quote failed:", error);
    return NextResponse.json(
      { error: "Could not price your order. Please try again." },
      { status: 500 }
    );
  }
}
