# Phase 1 — Data layer: what to do with these files

Drop-in for a fork of `blackeye75/ecommerce-app`. Paths match the repo's existing layout, and the `@/` alias is already configured in its `tsconfig.json`.

## Files

```
models/Industry.ts          new
models/Technology.ts        new
models/Product.ts           REPLACES the existing one
models/Order.ts             REPLACES the existing one
models/License.ts           new
models/DownloadLog.ts       new
models/ServiceRequest.ts    new
models/Enquiry.ts           new
models/index.ts             REPLACES the existing one
lib/product.ts              new — public field projection
lib/licenseKey.ts           new
lib/orderNumber.ts          new
lib/recountTaxonomy.ts      new
types/catalog.ts            new — shared enums
scripts/seed.ts             REPLACES the existing one
```

## Delete from the fork

`models/Category.ts`, `models/Review.ts`, `models/Address.ts`, `app/api/reviews/*`, `app/api/wishlist/*`, `app/api/addresses/*`, `app/admin/reviews/*`, `components/admin/VariantBuilder.tsx`, `components/storefront/WishlistButton.tsx`, `components/storefront/ProductReviews.tsx`, and the `wishlist` / `addresses` fields on `User`.

`lib/recomputeProductRatings.ts` goes too — the fields it writes no longer exist.

## It will not compile immediately, and that's expected

Replacing `Product` and `Order` breaks every route that referenced the old fields. That's the point: the compiler is now your migration checklist. Run `npx tsc --noEmit` and work the list. The ones that will shout loudest:

- `app/api/products/route.ts` — `category` → `industry`, add `techStack` / `platform` filters, apply `PUBLIC_PRODUCT_PROJECTION`
- `app/api/orders/route.ts` — `shippingAddress` gone, `quantity` gone, add `generateOrderNumber()`
- `lib/confirmRazorpayPayment.ts` — `orderStatus: "placed"` is no longer a valid enum value
- `lib/invoice/compute.ts` — reads `order.shippingAddress` for place of supply; point it at `order.billing`
- `components/admin/ProductForm.tsx` — stock/variant fields to remove, new fields to add

Do not stub these to make the build pass. Each one is a real decision you'd otherwise discover in production.

## Three things in here that are load-bearing

**The compound unique index on `License { order, product }`.** This is what makes the delivery webhook safe to run twice, which it will be — Razorpay fires `payment.captured` and `order.paid` for the same payment, and the repo's webhook handler calls the same confirmation function for both. In Phase 4 the second call must fail on this index and be swallowed, not mint a second key and send a second email. If you ever find yourself tempted to drop it because a retry is erroring, the retry erroring is the feature.

**The `pre("validate")` hook on `Product`.** A product not built in-house cannot reach `published` without a right-to-resell document on file. Your own compliance notes say to record this; putting it in the schema is the difference between a rule and an intention.

**`PUBLIC_PRODUCT_PROJECTION` in `lib/product.ts`.** `sourceFileKey` is the private bucket path to the thing customers pay for. Every public read goes through the projection or `toPublicProduct()`. It is an exclusion list, so a new private field has to be added there deliberately — but do add it, because the failure mode is silent and total.

## Seeding

The seed script now refuses to run without `SEED_ADMIN_PASSWORD` in `.env.local` rather than falling back to a default. The original's default-password admin is the kind of thing that survives to production.

```bash
SEED_ADMIN_EMAIL=you@geoloide.com
SEED_ADMIN_PASSWORD=<strong value>
npm run seed
```

It clears the catalogue collections but deliberately leaves `Order`, `License` and `DownloadLog` alone, so a stray run can't destroy delivery records. It will still orphan any existing orders by recreating products with new ids — treat running it against anything real as a mistake.

## Still open before Phase 2

- **GST treatment.** `sacCode` defaults to `997331` (licensing services for the right to use software) at 18%. Some sellers use HSN 8523 instead, and the export-of-services path needs an LUT declaration and nil tax. Get your CA to confirm both before the first live invoice — the invoice snapshot is immutable by design, so corrections mean credit notes, not edits.
- **Add-on prices** live in `SiteSettings`, not yet added. The checkout must recompute the total from those stored values; the client's number is a display, never an input.
- **Deployment payload retention.** `ServiceRequest.payload` will hold customers' hosting credentials. `payloadPurgedAt` is on the model for a purge job that doesn't exist yet. Write it in Phase 5, before you accept the first deployment order.
