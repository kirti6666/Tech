"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/price";
import type { AddonOffer } from "@/lib/addons";

/**
 * Add-on prices and copy.
 *
 * The description isn't decoration — it's what a buyer reads at checkout
 * while deciding whether ₹15,000 for rebranding is worth it, so it's edited
 * here alongside the price rather than being hardcoded.
 *
 * Turning an add-on off hides it from checkout but leaves it on orders that
 * already bought it, which is why the toggle says "offered at checkout"
 * rather than "active" — the latter reads like it would break existing work.
 */
export function AddonSettingsForm({ initial }: { initial: AddonOffer[] }) {
  const router = useRouter();
  const [addons, setAddons] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(index: number, patch: Partial<AddonOffer>) {
    setAddons(addons.map((a, i) => (i === index ? { ...a, ...patch } : a)));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/admin/settings/addons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addons }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {addons.map((addon, index) => (
        <section key={addon.type} className="card overflow-hidden">
          <div className="panel-head flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-ink">{addon.label}</h2>
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={addon.isActive}
                onChange={(e) => update(index, { isActive: e.target.checked })}
                className="accent-accent-deep"
              />
              Offered at checkout
            </label>
          </div>

          <div className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_9rem_7rem]">
            <label className="block sm:col-span-1">
              <span className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                Label shown to buyers
              </span>
              <input
                value={addon.label}
                onChange={(e) => update(index, { label: e.target.value })}
                className="field mt-1"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                Price (₹, ex-GST)
              </span>
              <input
                type="number"
                min={0}
                value={addon.price}
                onChange={(e) => update(index, { price: Number(e.target.value) })}
                className="field mt-1 tabular"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                GST %
              </span>
              <input
                type="number"
                min={0}
                max={28}
                value={addon.gstRate}
                onChange={(e) => update(index, { gstRate: Number(e.target.value) })}
                className="field mt-1 tabular"
              />
            </label>

            <label className="block sm:col-span-3">
              <span className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                Description at checkout
              </span>
              <textarea
                value={addon.description}
                onChange={(e) => update(index, { description: e.target.value })}
                rows={2}
                className="field mt-1"
              />
            </label>
          </div>

          <p className="border-t border-rule-soft px-5 py-2.5 text-xs text-ink-faint">
            Buyer sees {formatPrice(addon.price)} plus {addon.gstRate}% GST ={" "}
            <span className="tabular">
              {formatPrice(Math.round(addon.price * (1 + addon.gstRate / 100)))}
            </span>{" "}
            · SAC {addon.sacCode}
          </p>
        </section>
      ))}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-emerald-700">
          Saved. New prices apply to future orders only — existing orders and
          invoices keep the price they were charged.
        </p>
      )}

      <button type="button" onClick={save} disabled={busy} className="btn-primary">
        {busy ? "Saving…" : "Save prices"}
      </button>
    </div>
  );
}
