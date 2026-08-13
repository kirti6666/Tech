# Phase 6 — Admin panel

Type-checked clean. Every link in the sidebar now resolves to a real page — before this phase, five of the seven 404'd.

## Files

```
components/admin/AdminNav.tsx           new — active state + work-waiting badges
components/admin/OrderActions.tsx       new — refund/revoke
components/admin/ServiceWorkspace.tsx   new — the credential reveal screen
components/admin/EnquiryCard.tsx        new
components/admin/TaxonomyManager.tsx    new
components/admin/AddonSettingsForm.tsx  new

app/admin/layout.tsx                    EDITED — nav extracted, badges added
app/admin/page.tsx                      EDITED — lean() cast fixes
app/admin/orders/page.tsx               new
app/admin/orders/[id]/page.tsx          new
app/admin/services/page.tsx             new
app/admin/services/[id]/page.tsx        new
app/admin/enquiries/page.tsx            new
app/admin/taxonomy/page.tsx             new
app/admin/settings/page.tsx             new

app/api/admin/enquiries/[id]/route.ts   new
app/api/admin/settings/addons/route.ts  new
```

## The screens that matter most

**Settings — the readiness panel.** Six checks at the top of the page, and every one of them is a failure that's silent until a customer hits it. Storage unset means downloads 503 *after* payment clears. `CREDENTIALS_ENCRYPTION_KEY` unset means deployment intake refuses details. `pricesIncludeTax` left at its default means you absorb 18% GST on every single sale and nothing anywhere looks wrong. Seller state code blank means every order is charged CGST+SGST including genuinely inter-state ones.

None of these surface elsewhere. If you read one screen after deploying, read this one.

**Orders — the undelivered banner.** A paid order with no licence is invisible in every other view: the payment succeeded, the invoice sent, the row looks normal. The customer finds out before you do. That state gets a red banner on the list, a filter tab, and a warning on the detail page. It's what the `{ paymentStatus: 1, deliveredAt: 1 }` index from Phase 1 was for.

**Service queue — two kinds of waiting.** "Pending" conflates *waiting on the customer* (paid, no intake details yet) and *waiting on us* (details in, nobody picked it up). Those need different actions, so they're separate badges. Conflating them is how a request sits for a month with each side assuming the other holds it. Requests older than 14 days turn red.

**Service detail — reveal is a button.** Credentials render masked from the server, so no decrypted password ever reaches the HTML. Plaintext requires an explicit click that fires a separate audited request. Two reasons for the friction: an audit log that fires on page view tells you nothing, and a password sitting on screen during a screen-share is a leak waiting to happen. Marking the work delivered purges the secrets immediately rather than waiting for the retention job, and clears them from the component so the screen can't show stale plaintext.

**Refund — the confirm spells out what it doesn't do.** It revokes access; it does not move money. An operator who assumes otherwise leaves a customer with neither access nor their refund. A reason is mandatory because it lands on the licence record, and that record is what makes your refund policy enforceable six months later.

**Taxonomy — slugs are shown and locked.** `/industry/fintech` and `/technology/react` are indexed URLs. Renaming one discards its ranking and 404s every inbound link. Showing the slug greyed out is more honest than hiding the field and letting someone assume the display name is all there is. Delete is disabled with the product count visible next to it.

## Sorting, deliberately inconsistent

Orders newest-first; service queue oldest-first. Orders are a record you scan, service requests are a queue you work — and sorting a queue newest-first buries the three-week-old request under this morning's arrivals.

## Still open in the admin panel

- **`/admin/settings/invoice`** is linked from the settings page and doesn't exist. Company details, GSTIN, seller state code and `pricesIncludeTax` currently have to be edited in the database. That's the highest-value remaining admin gap, since three of the six readiness checks point at values you can't change from the UI.
- **`/admin/licenses`** as a standalone screen. The API is complete and licences are reachable through their order, but there's no "find this licence key" search — which is what support will actually want when a customer emails a key.
- **Bulk actions.** Everything is one row at a time. Fine at current volume; revisit when the queue is regularly over twenty.
