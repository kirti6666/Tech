# Phase 4 — Digital delivery

Type-checked clean against the real repo dependencies. Licence-key normalisation, the rate limiter and the delivery email are behaviour-tested: keys round-trip from any casing or spacing, the limiter blocks on attempt 11 of a 10-per-hour window and isolates per user, and the email escapes customer names and contains no signed URL.

## Files

```
lib/storage.ts                                  new — private S3/R2 access
lib/rateLimit.ts                                new — Redis + in-memory fallback
lib/github.ts                                   new — collaborator invite/remove
lib/delivery/issueLicenses.ts                   new
lib/delivery/deliveryEmail.ts                   new
lib/delivery/revokeOrderAccess.ts               new
lib/confirmPayment.ts                           EDITED — delivery wired into the seam

app/api/downloads/[key]/route.ts                new — the authorisation gate
app/api/admin/licenses/[id]/route.ts            new
app/api/admin/orders/[id]/refund/route.ts       new
app/api/admin/products/[id]/source/route.ts     new — signed direct upload
app/(storefront)/account/purchases/page.tsx     new
components/storefront/account/DownloadButton.tsx new
```

**Install:** `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

**New environment variables:**

```
STORAGE_BUCKET=            # R2 bucket or S3 bucket name
STORAGE_ENDPOINT=          # R2 only: https://<account>.r2.cloudflarestorage.com
STORAGE_REGION=auto        # "auto" for R2, real region for S3
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
GITHUB_TOKEN=              # optional — fine-grained PAT, Administration: read/write
UPSTASH_REDIS_REST_URL=    # optional but strongly recommended
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_APP_URL=       # used to build the link in the delivery email
```

## Block public access at the bucket, not in code

R2 is private unless you attach a public domain — don't. On S3, turn on Block Public Access at the bucket level and leave the ACLs alone.

This matters more than anything in `lib/storage.ts`. The unguessable segment in the storage key is defence in depth; if the bucket is readable, an unguessable key in a public bucket is still a public file, and it will end up in a crawler's index eventually.

## How authorisation actually works

One route can hand out a paid archive: `POST /api/downloads/[key]`. The decision is made there, in order — signed in, rate limited, licence belongs to *this user*, licence active, count below limit.

**The licence key is not an authorisation token.** The lookup is `License.findOne({ key, user: user.id })` — scoped to the session's user. A leaked or forwarded key downloads nothing for anyone else, which is why it's safe to put in an email and read out over the phone.

**The counter is claimed atomically.** The limit re-check and the increment happen in one `findOneAndUpdate` with `$expr: { $lt: ["$downloadCount", "$downloadLimit"] }`. Two tabs pressing Download together can't both pass a limit of one. This is also the real cross-instance protection — the in-memory rate limiter is per-process and, without Redis, the effective limit is roughly the configured one times the instance count.

**POST, not GET.** A GET download link gets prefetched by browsers and link previewers, silently burning downloads the customer never asked for.

**The signed URL never reaches the DOM as an href.** The button fetches it and assigns to `location`. A link sitting in the page can be right-click-copied, and for fifteen minutes it works for whoever receives it.

**The delivery email contains no download link at all** — only the licence key and a link to the dashboard. A signed URL in an email is stale within fifteen minutes and generates support tickets, and a forwarded email would otherwise be a working download.

## Idempotency, closed

The Phase 3 atomic pending→paid transition is the primary guarantee. `issueLicenses` adds a second: on MongoDB error 11000 against the compound unique index `License { order, product }`, it fetches the existing licence and treats delivery as already done.

That belt-and-braces is deliberate. "Primary guarantee and nothing else" is how you discover the guarantee had a hole — by emailing a customer two licence keys.

Anything that isn't a duplicate-key error is rethrown, so the webhook returns non-2xx and the gateway retries. A paid order with no licence must never be quietly acknowledged. The `{ paymentStatus: 1, deliveredAt: 1 }` index from Phase 1 is there so you can query for exactly that state — worth an admin alert.

## Refunds

`POST /api/admin/orders/[id]/refund` revokes licences, removes GitHub access, cancels undelivered service work and marks the order refunded. **It does not move money** — that happens in the Razorpay or Stripe dashboard. Keeping them separate means a bug here can't pay money out, and a refund issued directly in the gateway still gets recorded when someone runs this.

Revocation never deletes a licence. An audit trail with holes is worse than none: you need to answer "did this person have access, and when did it stop".

GitHub failures are surfaced in the response rather than swallowed, because that's the one part of a revocation that silently leaves the door open. Note that removing a collaborator does **not** cancel a pending invitation — `removeCollaborator` handles both, and missing the second is exactly the hole revocation exists to close.

Be honest with yourself about what revocation buys: the customer already has the file. What you're closing is ongoing access, and creating the record that makes the refund policy enforceable.

## Source file upload

Two-step, because the archive can't pass through the server — Vercel caps a request body at 4.5 MB. `POST` signs a direct-to-bucket URL, the browser PUTs to it, then `PUT` confirms and records the key.

The confirm step verifies the object actually exists via `HeadObject` before pointing the product at it. Without that, a failed upload leaves a product whose `sourceFileKey` names nothing — and you find out when a paying customer presses Download. It also rejects keys outside `source/<slug>/`, so a crafted request can't point one product at another's archive.

## Still open

- **The service intake form.** `/account/services/[id]` is linked from the purchases page but doesn't exist yet — that's Phase 5. Until then a customer who buys rebranding has a pending request and nowhere to send their logo.
- **Deployment payload retention.** Those requests will hold customers' hosting credentials. `payloadPurgedAt` is on the model; the purge job still isn't written. Write it before you accept the first deployment order.
- **Refund policy copy** must state exactly what happens: licence revoked, repository access removed, source to be deleted. Write it before taking the first payment — it's what makes the revocation record mean something.
- **Set `NEXT_PUBLIC_APP_URL`** or the delivery email's button links to a relative path and won't work from an inbox.
