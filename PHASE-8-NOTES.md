# Phase 8 — Hardening

Type-checked clean. Currency conversion, verification tokens and the auth rate limits are behaviour-tested: conversion always rounds up, tokens are URL-safe and unguessable from their stored hash, login blocks on attempt 9 of 8, register on 6 of 5, and limits isolate per IP.

## Files

```
lib/stripe.ts                                    new — client + INR→USD
lib/verification.ts                              new
lib/notifications/newOrder.ts                    new
lib/confirmPayment.ts                            EDITED — notification wired in
models/VerificationToken.ts                      new
middleware.ts                                    new — auth rate limiting
components/Analytics.tsx                         new

app/api/payments/stripe/create-session/route.ts  new
app/api/payments/stripe/webhook/route.ts         new
app/api/auth/verify/route.ts                     new
app/api/auth/resend-verification/route.ts        new
app/api/cron/backup/route.ts                     new

vercel.json                                      new — cron schedules
.env.example                                     new — every variable, consolidated
```

**Install:** `npm i stripe`

**Still to wire by hand:**
- `<Analytics />` into `app/(storefront)/layout.tsx`
- `sendVerificationEmail(user._id.toString(), email, name)` at the end of the existing `app/api/auth/register/route.ts`, wrapped in try/catch — a mail failure must not fail the registration
- `/verify-email` page: read `?token=`, POST it to `/api/auth/verify`, show the result
- Route checkout to Stripe when `billing.country !== "IN"` (currently `CheckoutClient` always calls Razorpay)

## Decisions worth understanding

**FX is a fixed rate you set, not a live feed.** `INR_PER_USD` in the environment, defaulting to 88. A live rate sounds better and is worse: your listed price would change between a buyer opening the page and paying, checkout would depend on a third-party API, and refunds get ugly — you'd return USD at today's rate what you received at last month's. Set it slightly conservative; the margin covers Stripe's higher international fees and the settlement spread. Review when the rate moves a few percent. Conversion always rounds **up** to the whole dollar, partly for readable prices, partly because rounding down repeatedly is a leak you never notice.

**Verification doesn't gate buying.** Blocking checkout behind a confirmation email costs real orders — the customer is holding a card, the email is in spam, they leave. The payment cleared either way, so the order is real. What verification gates is confidence in the *delivery address*: a typo'd email sends licence keys to a stranger. So the purchases page prompts, and support treats an unverified address as unconfirmed when asked to resend a licence.

**Tokens are stored hashed.** The raw value exists only in the emailed link. A leaked database dump doesn't let anyone verify arbitrary accounts. A TTL index expires them after 24 hours, so there's no cleanup job to forget.

**Stripe's `charge.refunded` is logged, not acted on.** Auto-revoking would kill a customer's access on a *partial* refund you issued for a service. Revocation stays a deliberate admin action with a written reason.

**Rate limiting lives in middleware, not in routes.** Sign-in runs through NextAuth's catch-all, which isn't a file you should fork to add a limiter. Middleware covers it, register and password reset uniformly, and any auth route added later is protected by path match rather than by someone remembering. Only POSTs are limited — NextAuth issues GETs to those paths for CSRF tokens on ordinary page loads, and limiting those breaks sign-in for normal visitors.

## Three things where I'd rather be blunt

**Without Upstash, the rate limiting is close to decorative.** The fallback limiter is per-process and serverless runs many processes, so the effective limit multiplies by instance count. Set `UPSTASH_REDIS_REST_URL` in production. (The download limit is unaffected — that counter is atomic in MongoDB.)

**The backup endpoint is not a database backup.** It can't be: `mongodump` doesn't exist in a serverless runtime and a 60-second function can't stream a growing database. Your real backup is your provider's. **MongoDB Atlas takes no backups at all on the free tier** — if you're planning to run production there, this endpoint is not the mitigation, upgrading is. What it does export is the records you genuinely cannot reconstruct: orders, licences, invoices, service requests. Products can be re-uploaded; you cannot rebuild who bought what or what a tax invoice said, and you're legally required to keep the latter for eight years. Service payloads are excluded so backups don't quietly undo the credential-purge design.

**Three Stripe webhook mistakes are pre-empted in the code**, and they're the ones everyone hits: signature verification must use the raw body (`req.text()`, never re-serialised JSON); `checkout.session.completed` does *not* mean paid for delayed payment methods, so `payment_status` is checked explicitly; and already-handled events return 2xx, because Stripe retries non-2xx for days and one duplicate becomes a retry storm.

## Testing before launch

- **Both webhooks with the CLI.** `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`, and Razorpay's test webhooks. Fire the same event twice and confirm exactly one licence and one email.
- **The purge job.** Set `deliveredAt` back a fortnight on a test service request, call the cron endpoint with the bearer token, confirm the credentials are gone and the rest of the record survives.
- **The backup.** Run it, download the JSON from the bucket, and confirm an order you recognise is in it. A backup nobody has ever read is not a backup.
- **A real end-to-end purchase in test mode**, all the way through to downloading the archive.

## Where this leaves you

All eight phases are written. What has *not* happened is Phase 0 — forking the repo, deleting the retail leftovers (wishlist, reviews, variants, COD, shipping), and working the compiler error list until it builds. Every file here is type-checked in isolation and unit-tested where the logic warranted it. None of it has run against a real database, a real payment gateway, or a real bucket.

Budget a week for that integration pass. It's where the remaining surprises are.
