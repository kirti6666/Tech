import Link from "next/link";
import { getAddons } from "@/lib/addons";
import { getInvoiceSettings } from "@/lib/invoice/settings";
import { AddonSettingsForm } from "@/components/admin/AddonSettingsForm";
import { isStorageConfigured } from "@/lib/storage";
import { isEncryptionConfigured } from "@/lib/crypto";
import { isGitHubConfigured } from "@/lib/github";

export const dynamic = "force-dynamic";

/**
 * Settings, plus a readiness panel.
 *
 * The checks at the top exist because every one of them fails silently and
 * late. Storage missing means downloads 503 after someone has paid.
 * Encryption missing means deployment intake refuses to accept details.
 * pricesIncludeTax left on means you absorb 18% GST on every sale without
 * anything looking wrong. None of these surface anywhere else until a
 * customer hits them.
 */
export default async function AdminSettingsPage() {
  const [addons, invoice] = await Promise.all([getAddons(), getInvoiceSettings()]);

  const checks = [
    {
      ok: isStorageConfigured(),
      label: "Private file storage",
      bad: "Downloads will fail after payment. Set the STORAGE_* variables.",
    },
    {
      ok: isEncryptionConfigured(),
      label: "Credential encryption",
      bad: "Deployment intake will refuse details. Set CREDENTIALS_ENCRYPTION_KEY.",
    },
    {
      ok: !invoice.tax.pricesIncludeTax,
      label: "Prices quoted excluding GST",
      bad: "Prices are being treated as GST-inclusive — you're absorbing the tax on every sale.",
    },
    {
      ok: Boolean(invoice.seller.stateCode),
      label: "Seller state code set",
      bad: "Every order falls back to CGST+SGST, including inter-state ones.",
    },
    {
      ok: Boolean(invoice.seller.gstin),
      label: "Seller GSTIN set",
      bad: "Tax invoices will be issued without your GSTIN.",
    },
    {
      ok: isGitHubConfigured(),
      label: "GitHub access (optional)",
      bad: "Repository invitations and revocation on refund won't work.",
      optional: true,
    },
  ];

  const failing = checks.filter((c) => !c.ok && !c.optional);

  return (
    <div>
      <header className="mb-6">
        <p className="label">Configuration</p>
        <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
          Settings
        </h1>
      </header>

      <section
        className={`card mb-6 overflow-hidden ${failing.length ? "ring-1 ring-red-200" : ""}`}
      >
        <div className="panel-head">
          <h2 className="text-sm font-medium text-ink">Readiness</h2>
        </div>
        <ul className="divide-y divide-rule-soft">
          {checks.map((check) => (
            <li key={check.label} className="flex gap-3 px-5 py-3">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  check.ok
                    ? "bg-emerald-500"
                    : check.optional
                      ? "bg-ink-ghost"
                      : "bg-red-500"
                }`}
              />
              <div>
                <p className="text-sm text-ink">{check.label}</p>
                {!check.ok && (
                  <p
                    className={`mt-0.5 text-xs ${
                      check.optional ? "text-ink-faint" : "text-red-700"
                    }`}
                  >
                    {check.bad}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-rule-soft px-5 py-3 text-xs text-ink-faint">
          Tax and company details are edited in{" "}
          <Link href="/admin/settings/invoice" className="text-accent-deep hover:underline">
            invoice settings
          </Link>
          .
        </p>
      </section>

      <h2 className="mb-3 font-display text-2xl font-light text-ink">
        Service pricing
      </h2>
      <AddonSettingsForm initial={addons} />
    </div>
  );
}
