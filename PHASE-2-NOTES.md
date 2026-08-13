# Phase 2 — Catalogue: what's here and how to wire it

Type-checked clean against Next.js 14.2.5, React 18 and the repo's TypeScript config. The param parser and URL builder are round-trip tested (parse → build → re-parse is stable, including dedup, invalid enum values, reversed price ranges and junk page numbers).

## Files

```
lib/catalogue.ts                                     new — the query builder
lib/taxonomy.ts                                      new — facet lists + label maps
lib/price.ts                                         new — ₹ formatting, Indian grouping
lib/fonts.ts                                         new — the three typefaces
tailwind.config.ts                                   REPLACES
app/globals.css                                      REPLACES

app/(storefront)/shop/page.tsx                       REPLACES
app/(storefront)/product/[slug]/page.tsx             REPLACES
app/(storefront)/industry/[slug]/page.tsx            new
app/(storefront)/technology/[slug]/page.tsx          new
app/api/products/route.ts                            REPLACES

components/storefront/ProductCard.tsx                REPLACES
components/storefront/catalogue/CatalogueShell.tsx   new
components/storefront/catalogue/FilterPanel.tsx      new
components/storefront/catalogue/CatalogueToolbar.tsx new
components/storefront/catalogue/ProductGrid.tsx      new
components/storefront/catalogue/Pagination.tsx       new
components/storefront/product/ScreenshotGallery.tsx  new
components/storefront/product/DemoPanel.tsx          new
components/storefront/product/StackTable.tsx         new
components/storefront/product/PurchasePanel.tsx      new
```

**Delete:** `components/storefront/ShopFilters.tsx`, `app/(storefront)/category/*`, `components/storefront/ProductDetailClient.tsx`.

## Wiring

One change in `app/layout.tsx` — add the font variables to `<html>`:

```tsx
import { fontVariables } from "@/lib/fonts";
// ...
<html lang="en" className={fontVariables}>
```

Everything else is drop-in. `app/(storefront)/shop/loading.tsx` from the base repo still works.

**One dangling reference:** `PurchasePanel` posts "Add to cart" to `/api/cart`, which doesn't exist until Phase 3. "Buy now" links to `/checkout?product=`, same. Both are deliberate — the panel is the right shape now and the endpoints land next phase — but the add-to-cart button will 404 until then. If you want to demo before Phase 3, hide that button rather than stubbing the route.

## The design direction

The brief said take reference from heloix.com. I didn't copy its look — a marketplace competing on "we have 500 products" needs a different page from one competing on "this is a real system your team can maintain," and yours is the second.

**Blueprint.** You sell the drawings other people build from, so the storefront borrows from technical drawing and datasheets: hairline rules instead of card shadows, a cool paper ground, and one blueprint blue (`#1B5FCC`) doing all the interactive work. No gradients, no filled pills, no drop shadows — the only saturated colour on a listing page is the price and the buy button.

**Three faces, three jobs.** Space Grotesk for display (engineered letterforms, not editorial), IBM Plex Sans for body, IBM Plex Mono for everything measurable — stack, versions, server requirements, prices, and later licence keys. Same superfamily for body and mono, so the spec rows read as part of the page rather than a code block dropped into it. Tabular figures are on globally, because ₹74,999 stacked above ₹1,19,999 visibly staggers without them.

**The signature is the stack table.** Your spec asked for the tech stack "clearly separated" by layer, which is the single most load-bearing requirement on the page — the buyer's real question is "can my team maintain this," and it needs Frontend / Backend / Mobile / Database as labelled rows, not a row of framework logos. So that table is where the boldness goes, and everything around it stays quiet. Empty layers are omitted rather than printed as "—", so a web-only product doesn't advertise a missing mobile app.

## Decisions you may want to overrule

**OR within a facet, AND across facets.** Ticking React and Vue shows products using either, which is how every faceted catalogue behaves. You could argue a *stack* filter means "all of these" — if you switch `$in` to `$all` in `lib/catalogue.ts`, change the filter heading too, because the two readings aren't interchangeable and buyers will assume the standard one.

**Sorting is on effective price, not list price.** This is why the catalogue is an aggregation rather than a `find()`. A `find()` sorted on `price` puts a ₹75,000 product discounted to ₹59,999 above a ₹64,999 one, and "price: low to high" quietly isn't. Costs one pipeline stage; worth it.

**Filtered `/shop` URLs are `noindex, follow`.** `/shop?tech=react` and `/technology/react` would otherwise compete for the same query with near-identical content. The landing pages have their own copy and titles, so they're the canonical filtered surfaces and the query-string versions stay out of the index. The `follow` matters — crawlers should still walk through to the products.

**No `aggregateRating` in the Product structured data.** Reviews are out of MVP scope, and emitting rating markup with nothing behind it is the fabricated-testimonial problem in machine-readable form. Google penalises it, and your own compliance notes rule it out.

**Demo credentials are shown in full and copyable.** A buyer who opens the admin demo and finds it working is most of the way to paying, so hiding them behind a lead-capture form costs more than it gains. This assumes the demo admin is a sandbox that gets reset — `DemoPanel.tsx` is the reason that has to stay true.

## Two things Phase 2 needs from elsewhere

- **`productCount` must be accurate**, or facets show wrong numbers and zero-result tags get offered. `recountTaxonomy()` from Phase 1 has to run on every publish, unpublish and delete — wire it into the admin product routes in Phase 6, and add the nightly job.
- **Screenshots are the whole detail page.** The layout gives the gallery the largest element on the screen because it's the only real evidence the product exists. Ten products with no images will look broken in a way no amount of layout fixes.
