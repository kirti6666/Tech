# Phase 5 — Services, enquiries, and credential handling

Type-checked clean. The encryption, validation and masking layers are behaviour-tested: values round-trip, tampered ciphertext is rejected, unknown keys are dropped rather than stored, passwords come back encrypted while ordinary fields stay readable, and masking hides secrets without touching the rest.

## Files

```
lib/crypto.ts                                    new — AES-256-GCM field encryption
lib/services/schemas.ts                          new — field definitions + validation
lib/services/purgeCredentials.ts                 new — retention job
lib/services/notifications.ts                    new — status + enquiry emails
lib/middleware/logAdminAction.ts                 EDITED — new target types
models/AuditLog.ts                               EDITED — new actions

app/api/services/[id]/route.ts                   new — customer intake
app/api/admin/services/route.ts                  new — the queue
app/api/admin/services/[id]/route.ts             new — status, notes, audited reveal
app/api/enquiries/route.ts                       new — contact + custom work
app/api/cron/purge-service-payloads/route.ts     new

app/(storefront)/account/services/[id]/page.tsx  new — closes the Phase 4 dangling link
app/(storefront)/contact/page.tsx                new
components/storefront/account/ServiceIntakeForm.tsx new
components/storefront/ContactForm.tsx            new
```

**New environment variables:**

```
CREDENTIALS_ENCRYPTION_KEY=   # openssl rand -base64 32
CRON_SECRET=                  # any long random string
ADMIN_NOTIFICATION_EMAIL=     # where new enquiries and intake submissions land
```

**Schedule the purge** in `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/purge-service-payloads", "schedule": "0 3 * * *" }] }
```

## The uncomfortable part: you're asking for server passwords

A deployment request means a customer types their hosting credentials into your web form. That is the highest-risk data in this entire application — higher than payment details, which you never touch because Razorpay handles them. Four things follow from that.

**Encrypted at rest, per field.** AES-256-GCM, so tampering is detected rather than silently decrypting to garbage. Only fields marked `secret: true` in `lib/services/schemas.ts` get this — three fields, all on deployment. That concentration is deliberate: everything else about a service request is ordinary business data and encrypting it would just make the admin panel harder to use for no gain.

Be clear about what this buys: it protects against a leaked database dump and against an admin screen accidentally rendering a password. It does not protect against someone holding both the database and the key. Keep `CREDENTIALS_ENCRYPTION_KEY` out of your database backups.

**The API refuses to store credentials if the key isn't configured.** Not a warning, a 503. Falling back to plaintext because a config value is missing is how a database ends up full of unencrypted server passwords, and you'd never notice until it mattered.

**Deleted seven days after handover**, plus immediately on delivery. This is the part that actually protects customers — encryption covers the window where you legitimately need the password; deletion is what stops that window being "forever". Without the purge, a year from now you're holding live credentials for every deployment you've ever shipped, and the blast radius of a breach grows every month you operate. Only the secret fields go; the domain, provider and notes stay, because you need the record of what work was done.

**Reading them is an audited, explicit act.** The admin detail route masks by default and only decrypts on `?reveal=1`, writing an audit entry each time. If credentials appeared just by opening a page, the log would tell you nothing and nobody would think twice about it.

The form says all of this to the customer before they type, including the suggestion to create a temporary account. Worth keeping — you're asking for a lot of trust and the honest thing is to say what you'll do with it.

## Smaller decisions

**Submitting details doesn't move the request to "in progress".** That's a claim about what your team is doing, and only your team can make it. The customer's action sets `payloadSubmittedAt`; the status stays pending until someone picks it up.

**Secrets are never returned, not even to the customer who typed them.** They know their own password, and a read-back endpoint that decrypts on request is a far bigger target than one that only writes. Non-secret fields pre-fill on edit; secret ones show "leave blank to keep".

**The admin queue sorts oldest-first.** A support queue sorted newest-first buries the three-week-old request under today's arrivals — which is exactly the one that needs attention.

**A stale-credentials check, not an auto-purge.** Requests sitting pending for 60 days with credentials attached are the most dangerous rows in the database, but the customer may still be waiting on the work, so the cron logs them for a human instead of silently deleting.

**No CAPTCHA on the enquiry form.** Rate limit by IP, a honeypot field, and length caps. A CAPTCHA punishes every genuine visitor to stop spam the first two catch most of anyway — add one when the log shows you need it, not before. The honeypot returns a cheerful 200 rather than an error, so bots don't learn to adapt.

## Still open

- **The admin service detail screen** — the API is complete, the UI isn't. `/admin/services` and `/admin/services/[id]` are Phase 6 along with the rest of the admin panel.
- **Logo uploads** currently take a URL, not a file. Fine for launch (customers usually have a logo hosted somewhere), but a direct upload using the Phase 4 signed-URL pattern would be better.
- **Enquiry admin views** — `/admin/enquiries` is linked from the notification email and doesn't exist yet.
- **Test the purge before trusting it.** Set `deliveredAt` back a fortnight on a test request and run the cron endpoint by hand. A retention job nobody has watched work is a retention policy you don't actually have.
