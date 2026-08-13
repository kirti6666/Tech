# Phase 7 — Homepage, static pages, SEO

Type-checked clean. Internal links were smoke-tested against the real route table — every static `href` in the codebase resolves to a page that exists. (The check skips template-literal hrefs with interpolation, so it's a floor, not a proof.)

## Files

```
app/(storefront)/page.tsx                    REPLACES — the homepage
app/(storefront)/about/page.tsx              new
app/(storefront)/faq/page.tsx                new — with FAQPage structured data
app/(storefront)/refund-policy/page.tsx      new
app/(storefront)/licence/page.tsx            new
app/(storefront)/terms/page.tsx              new
app/(storefront)/privacy/page.tsx            new
app/(storefront)/order-success/page.tsx      new — closes the Phase 3 dangling link
app/sitemap.ts                               REPLACES app/api/sitemap.ts
app/robots.ts                                REPLACES app/api/robots.ts

components/storefront/LegalPage.tsx          new — shared policy shell
components/storefront/SiteFooter.tsx         new
components/storefront/SiteStructuredData.tsx new

app/admin/settings/invoice/page.tsx          new
components/admin/InvoiceSettingsForm.tsx     new
app/api/admin/settings/invoice/route.ts      new
```

**Delete** `app/api/sitemap.ts` and `app/api/robots.ts` — the new files use the App Router convention and serve at the same URLs.

**Wire up** `SiteFooter` and `SiteStructuredData` in `app/(storefront)/layout.tsx`.

## The old sitemap was submitting 404s

Worth calling out because it would have failed quietly. The inherited sitemap listed `/category/[slug]` — a route that no longer exists — and filtered products on `isActive`, a field the digital `Product` model doesn't have, so the product query returned nothing. Left alone it would have handed Google a sitemap of dead URLs and no products at all.

The replacement also excludes landing pages with zero products. An indexed page rendering an empty grid is a thin-content signal and a dead end for whoever clicks it.

## Placeholders you must replace before launch

Three files contain invented company details, marked in the code:

- `app/(storefront)/about/page.tsx` — CIN, GSTIN, address
- `components/storefront/SiteFooter.tsx` — CIN, GSTIN
- `components/storefront/SiteStructuredData.tsx` — phone, logo path

A wrong CIN on a public page is worse than no CIN. Same for the `sameAs` social profiles in the structured data — delete the key rather than point it at an empty profile.

## The legal pages are drafts, and two of them are load-bearing

Have a lawyer review all four. But the **licence agreement** and the **refund policy** deserve your own attention before that, because they encode business decisions, not just legal boilerplate.

**The licence encodes one purchase = one end product.** A buyer may modify and deploy freely and may build for a client, but may not resell the source or reuse one purchase across unlimited client projects. That single boundary is the business model. Too permissive and one agency purchase substitutes for fifty; too restrictive and agencies — likely your best customers — can't buy at all. It's written in plain language deliberately: a buyer who doesn't understand the boundary will cross it by accident.

**The refund policy hinges on download state.** Full refund within 7 days if you haven't downloaded; generally final once you have, because you now hold a permanent copy. Anything vaguer is unenforceable for a product the buyer keeps forever, and pretending otherwise invites disputes you can't win. This is checkable in the admin panel — the order detail page shows the download log — so the policy can actually be applied consistently.

The **privacy policy** describes what the code genuinely does: download logs retained permanently, deployment credentials encrypted and purged after 7 days, card details never touching your servers. If any of those stop being true, that page changes the same day.

## Invoice settings — the readiness gap from Phase 6, closed

Seller identity, GSTIN, state code and the tax flags are now editable in the UI. Three guards worth knowing about:

- **State code is validated against the real GST table**, and cross-checked against the first two digits of the GSTIN. If they disagree, one is wrong and every invoice would misstate the place of supply.
- **`pricesIncludeTax` turns its own panel red when enabled**, with the arithmetic spelled out. For TechBro it must be off. Left on, a ₹89,999 sale is treated as ₹76,270 plus tax and you absorb the GST on every order with nothing looking broken.
- **Invoice numbering is deliberately not editable.** GST requires gapless sequential numbering; a field that lets someone reset the counter mid-year is a compliance problem waiting for a curious afternoon.

## What's left

Phase 8 only: Stripe for international orders, email verification, rate limiting wired onto the auth routes, Google Analytics, the WhatsApp order notification, and daily backups.

After that it's Phase 0 — forking, deleting the retail leftovers, and working the compiler error list until it builds against a real database and a real Razorpay account. Nothing so far has been run end to end.
