# TechBro

Digital marketplace for ready-made software products, sold with complete source code.
Operated by Geoloide Private Limited.

Next.js 14 (App Router) · TypeScript · MongoDB/Mongoose · Tailwind · Razorpay + Stripe · S3/R2

---

## Status

Compiles clean: 0 TypeScript errors, `next build` succeeds, all routes resolve.

**Not yet run against a real database, payment gateway or storage bucket.** Every
module is type-checked and the logic-heavy parts are unit-tested, but nothing has
completed an end-to-end purchase. Budget a week for that integration pass — it is
where the remaining surprises are.

---

## Setup

```bash
npm install
cp .env.example .env.local     # then fill it in — see the notes in that file
npm run seed                   # needs SEED_ADMIN_PASSWORD set
npm run dev
```

Minimum to boot: `MONGODB_URI`, `NEXTAUTH_SECRET`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`. Without the rest the site runs but payments, downloads and
deployment intake fail at the point of use, by design — each returns a clear error
rather than half-working.

---

## Before taking real money

Not optional. Each of these fails silently until a customer hits it.

1. **Set `pricesIncludeTax` to false** in `/admin/settings/invoice`. It defaults to
   `true` (Indian retail convention). Left on, a ₹89,999 sale is treated as ₹76,270
   + GST and you absorb the tax on every order with nothing looking wrong.
2. **Set the seller state code and GSTIN.** A blank state code means every order is
   charged CGST+SGST, including genuinely inter-state ones.
3. **Block public access on the storage bucket.** R2 is private unless you attach a
   public domain — don't. On S3, enable Block Public Access. An unguessable key in a
   readable bucket is still a public file.
4. **Set `CREDENTIALS_ENCRYPTION_KEY`.** Deployment intake refuses to store anything
   without it. Keep it out of database backups.
5. **Set `UPSTASH_REDIS_REST_URL`.** Without Redis the rate limiter is per-process,
   so on serverless the effective limit multiplies by instance count.
6. **Replace the placeholder CIN and GSTIN** in `app/(storefront)/about/page.tsx`,
   `components/storefront/SiteFooter.tsx` and
   `components/storefront/SiteStructuredData.tsx`.
7. **Have a lawyer review the four legal pages.** The licence agreement and refund
   policy encode business decisions, not boilerplate — see `PHASE-7-NOTES.md`.
8. **Confirm the SAC code (997331) and your LUT position with a CA.** The export
   path assumes you have an LUT on file; without one, exports are taxable and this
   code under-charges.
9. **Fire each payment webhook twice** and confirm exactly one licence and one email
   result.
10. **Check your database provider's backup tier.** MongoDB Atlas takes no backups at
    all on the free tier. `/api/cron/backup` exports business records; it is not a
    database backup and cannot be.

---

## Architecture notes

**One pricing engine.** `lib/pricing.ts` derives every price, discount and tax figure
from the database. The client sends product ids and choices, never amounts. The quote
endpoint, order creation and both gateways call the same function, so the cart figure,
the stored total and the charged amount cannot drift.

**Payment confirmation is idempotent.** `lib/confirmPayment.ts` transitions
pending→paid in a single atomic `findOneAndUpdate`. Razorpay fires two events per
payment and Stripe retries for days; exactly one caller proceeds. The compound unique
index on `License { order, product }` is the second line of defence — do not drop it.

**Downloads are authorised by session, not by licence key.** The lookup is scoped to
the signed-in user, so a leaked or forwarded key downloads nothing for anyone else.
The download counter is claimed atomically.

**Credentials are encrypted and deleted.** Deployment intake encrypts secret fields
with AES-256-GCM, the admin panel reveals them only on an explicit audited action, and
a nightly job purges them seven days after handover.

**Invoices are immutable snapshots.** Corrections need a credit note, not an edit.
`reconcileWithCharged()` warns when the charging engine and the invoice engine
disagree by more than a rupee.

---

## Phase notes

`PHASE-1-NOTES.md` through `PHASE-8-NOTES.md` document what each phase built, the
decisions taken and why, and what was deliberately left open. Read them before
changing anything in the payment, delivery or tax paths.

| Phase | Area |
|---|---|
| 1 | Data models |
| 2 | Catalogue, product pages, SEO landing pages |
| 3 | Cart, checkout, GST, Razorpay |
| 4 | Digital delivery — licences, signed downloads, revocation |
| 5 | Services, credential handling, enquiries |
| 6 | Admin panel |
| 7 | Homepage, static pages, sitemap |
| 8 | Stripe, verification, rate limiting, backups |

---

## Known gaps

- Checkout always routes to Razorpay; Stripe needs wiring for
  `billing.country !== "IN"`.
- `sendVerificationEmail()` is not yet called from the register route.
- `/verify-email` page needs building (read `?token=`, POST to `/api/auth/verify`).
- No `/admin/licenses` search screen — support will want to look up a licence key.
- Product screenshots are the largest element on every product page. Ten products
  with no images will look broken in a way no layout change fixes.
