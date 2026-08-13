import Link from "next/link";
import { getInvoiceSettings } from "@/lib/invoice/settings";
import { InvoiceSettingsForm } from "@/components/admin/InvoiceSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminInvoiceSettingsPage() {
  const settings = await getInvoiceSettings();

  return (
    <div>
      <Link
        href="/admin/settings"
        className="text-sm font-medium text-accent-deep hover:underline"
      >
        ← Settings
      </Link>

      <header className="mb-6 mt-3">
        <p className="label">Configuration</p>
        <h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">
          Invoice &amp; tax
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          These values are copied onto every tax invoice at the moment it is
          issued. Existing invoices keep the values they were created with —
          they are immutable by design, so a correction after the fact needs a
          credit note, not an edit. Get these right before your first live
          order.
        </p>
      </header>

      <InvoiceSettingsForm initial={JSON.parse(JSON.stringify(settings))} />
    </div>
  );
}
