# Phase 3 — Cart, checkout, payment and GST

Type-checked clean against the real repo dependencies (Next 14.2.5, mongoose, next-auth, razorpay). The invoice engine was exercised across all three tax treatments — intra-state, inter-state and export — with an add-on line in each; totals reconcile to the charged amount in every case.

## Files

```
lib/pricing.ts                                       new — the charging engine
lib/addons.ts                                        new
lib/states.ts                                        new
lib/confirmPayment.ts                                new — REPLACES lib/confirmRazorpayPayment.ts
lib/invoice/compute.ts                               EDITED (targeted, not rewritten)
models/AddonSettings.ts                              new
store/useCartStore.ts                                REPLACES

app/api/checkout/quote/route.ts                      new
app/api/orders/route.ts                              REPLACES
app/api/cart/route.ts                                new (closes the Phase 2 dangling link)
app/api/payments/razorpay/create-order/route.ts      REPLACES
app/(storefront)/checkout/page.tsx                   REPLACES
app/(storefront)/cart/page.tsx                       REPLACES (now redirects)

components/storefront/checkout/CheckoutClient.tsx    new
components/storefront/checkout/BillingForm.tsx       new
components/storefront/checkout/CartLines.tsx         new
components/storefront/checkout/OrderSummary.tsx      new
scripts/seed.ts                                      EDITED — see the bug note below
```

**Also update:** `/api/payments/razorpay/verify` and `/webhook` both import `confirmRazorpayPayment`. Change to `confirmPayment(orderId, { gateway: "razorpay", razorpayPaymentId })`. **Delete** `lib/confirmRazorpayPayment.ts`, `lib/constants.ts` (shipping fees), `app/api/addresses/*`.

## One setting you must change before going live

In the admin invoice settings, set **`pricesIncludeTax` to false**. It defaults to `true` (Indian retail convention), but your prices are quoted ex-GST and the product page says "plus 18% GST". Left at `true`, a ₹89,999 product would be treated as ₹76,270 + ₹13,729 tax and you'd absorb the GST on every sale.

Also set `seller.stateCode` — with it blank, every order falls back to intra-state CGST+SGST, including genuinely inter-state ones.

## A bug I introduced in Phase 1, now fixed

The seed script wrote coupons with `type` / `expiryDate`, but the repo's `Coupon` model uses `discountType` / `expiresAt`. Seeding would have thrown on validation. Fixed in the updated `scripts/seed.ts` — if you already ran the Phase 1 seed and it failed at the coupon step, that's why.

## Two decisions worth knowing about

**One calculation, not two.** Every price, add-on price, discount and tax figure is derived from the database in `quoteOrder()`. The client sends product ids and ticked checkboxes — never an amount. The quote endpoint, order creation and the Razorpay route all call that same function, so the cart figure, the stored total and the charged amount can't drift.

The retail original recomputed the cart independently in `/api/orders` and again in `/api/payments/razorpay/create-order`, each with its own copy of the coupon logic. The new create-order route reads `order.total` and does no arithmetic at all.

**Coupons apply to products only, not services.** Rebranding and deployment cost you hours. A 10% coupon that also discounts them turns a marketing offer into a loss on delivered work. If you disagree, it's one line in `lib/pricing.ts` — but decide deliberately rather than by default.

## The idempotency fix, stated precisely

I flagged this in Phase 1 and was slightly unfair to the original: it *does* guard with `if (order.paymentStatus === "paid") return`. The problem is that the guard is a read-check-write across three awaits, so two concurrent webhook deliveries can both read "pending" and both proceed. Razorpay fires `payment.captured` **and** `order.paid` for the same payment, and the repo routes both to the same function.

`confirmPayment` now does the transition as a single atomic `findOneAndUpdate` with `paymentStatus: "pending"` in the filter. Exactly one caller gets a document back; everything after that line runs once. That is what makes Phase 4 safe to bolt on — there's a marked seam in the file showing exactly where licence issuing goes.

The browser's Razorpay `handler` callback deliberately does nothing but clear the cart and navigate. Confirmation is the webhook's job: a browser that never comes back must not cost the buyer their purchase, and a browser that lies must not create one.

## Invoice engine: what changed and what didn't

I edited `lib/invoice/compute.ts` rather than rewriting it. It's legally sensitive, already correct, and the snapshot is immutable by design — the smallest change that works is the right one. Five edits:

1. Reads `order.billing`, falling back to `order.shippingAddress`, so invoices issued before the migration still render from their stored order.
2. **Export of services.** A non-Indian buyer is zero-rated under LUT: no GST, place of supply is the country with code 96, and the invoice carries the LUT declaration. Checked *before* the inter-state test, because an export is not an inter-state supply and charging IGST on it is wrong in the other direction.
3. Per-line SAC and GST rate from the order item, instead of one global HSN and rate.
4. **Add-ons render as their own invoice lines.** They're separately taxable supplies the buyer paid for, and a buyer claiming input credit needs them itemised. Folding them into the product price would understate the product and misdescribe the service.
5. Quantity defaults to 1 throughout.

I also added `reconcileWithCharged()`. Two engines now produce a number — `lib/pricing.ts` decides what to charge, `compute.ts` decides what the invoice says. They implement the same rules but they're separate code, and once an invoice is issued a divergence can only be fixed with a credit note. Call it right after computing a snapshot; it logs loudly when the two differ by more than a rupee.

## Still open

- **Confirm the SAC with your CA before the first live invoice.** Everything defaults to `997331` (licensing services for the right to use software) at 18%. Some sellers use HSN 8523. The export treatment also assumes you have an LUT on file — if you don't, exports are taxable and this code will under-charge.
- **Stripe** isn't here. The order model, `confirmPayment` and the currency field are all shaped for it; it's Phase 8.
- **Rate-limit `/api/checkout/quote`.** It's unauthenticated by design — asking someone to log in before they can see a tax-inclusive total loses orders — but it does hit the database on every keystroke-adjacent change.
- **`/checkout?add=<id>`** is handled by the no-JS cart route, but `CheckoutClient` doesn't yet read that parameter and merge the product into the local cart. Small gap; worth closing when you wire the header cart count.
