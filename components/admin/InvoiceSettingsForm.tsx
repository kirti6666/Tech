"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_STATES } from "@/lib/states";

/**
 * Seller identity and tax configuration.
 *
 * The `pricesIncludeTax` control is the dangerous one and is presented as a
 * choice with consequences spelled out, not a bare toggle. For TechBro it
 * must be OFF: prices are quoted ex-GST and the product page says "plus 18%
 * GST". Left on, a ₹89,999 sale is treated as ₹76,270 plus tax and you
 * absorb the difference on every order, with nothing in the interface
 * looking wrong.
 *
 * Changes affect future invoices only. Issued invoices are immutable
 * snapshots by design, which is what makes editing these fields safe.
 */

interface Settings {
  seller: {
    name?: string;
    legalName?: string;
    gstin?: string;
    stateCode?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email?: string;
    phone?: string;
  };
  tax: {
    gstEnabled: boolean;
    pricesIncludeTax: boolean;
    defaultGstRate: number;
    defaultHsnCode?: string;
    roundOffTotal: boolean;
  };
}

export function InvoiceSettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function setSeller(key: keyof Settings["seller"], value: string) {
    setSettings({ ...settings, seller: { ...settings.seller, [key]: value } });
    setSaved(false);
  }

  function setTax<K extends keyof Settings["tax"]>(
    key: K,
    value: Settings["tax"][K]
  ) {
    setSettings({ ...settings, tax: { ...settings.tax, [key]: value } });
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setErrors({});
    setFormError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/admin/settings/invoice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Could not save.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setFormError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden">
        <div className="panel-head">
          <h2 className="text-sm font-medium text-ink">Seller details</h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            Printed at the top of every tax invoice.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field
            label="Trading name"
            value={settings.seller.name ?? ""}
            error={errors["seller.name"]}
            onChange={(v) => setSeller("name", v)}
          />
          <Field
            label="Registered legal name"
            value={settings.seller.legalName ?? ""}
            onChange={(v) => setSeller("legalName", v)}
          />
          <Field
            label="GSTIN"
            value={settings.seller.gstin ?? ""}
            error={errors["seller.gstin"]}
            onChange={(v) => setSeller("gstin", v.toUpperCase())}
          />

          <label className="block">
            <span className="text-xs uppercase tracking-[0.06em] text-ink-faint">
              State of registration
            </span>
            <select
              value={settings.seller.stateCode ?? ""}
              onChange={(e) => {
                const code = e.target.value;
                const state = INDIAN_STATES.find((s) => s.code === code);
                setSettings({
                  ...settings,
                  seller: {
                    ...settings.seller,
                    stateCode: code,
                    state: state?.name ?? "",
                  },
                });
                setSaved(false);
              }}
              className={`field mt-1 ${errors["seller.stateCode"] ? "field-error" : ""}`}
            >
              <option value="">Select a state</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name} ({state.code})
                </option>
              ))}
            </select>
            {errors["seller.stateCode"] ? (
              <span className="mt-1 block text-xs text-red-700">
                {errors["seller.stateCode"]}
              </span>
            ) : (
              <span className="mt-1 block text-xs text-ink-faint">
                Decides CGST+SGST vs IGST on every order.
              </span>
            )}
          </label>

          <div className="sm:col-span-2">
            <Field
              label="Registered address"
              value={settings.seller.address ?? ""}
              onChange={(v) => setSeller("address", v)}
            />
          </div>
          <Field
            label="City"
            value={settings.seller.city ?? ""}
            onChange={(v) => setSeller("city", v)}
          />
          <Field
            label="PIN code"
            value={settings.seller.pincode ?? ""}
            onChange={(v) => setSeller("pincode", v)}
          />
          <Field
            label="Email"
            value={settings.seller.email ?? ""}
            onChange={(v) => setSeller("email", v)}
          />
          <Field
            label="Phone"
            value={settings.seller.phone ?? ""}
            onChange={(v) => setSeller("phone", v)}
          />
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="panel-head">
          <h2 className="text-sm font-medium text-ink">Tax</h2>
        </div>

        <div className="space-y-4 px-5 py-4">
          <Toggle
            checked={settings.tax.gstEnabled}
            onChange={(v) => setTax("gstEnabled", v)}
            label="Charge GST"
            hint="Turn off only if you are not GST registered."
          />

          <div
            className={`rounded-lg p-3 ${
              settings.tax.pricesIncludeTax ? "bg-red-50" : "bg-paper-alt"
            }`}
          >
            <Toggle
              checked={settings.tax.pricesIncludeTax}
              onChange={(v) => setTax("pricesIncludeTax", v)}
              label="Product prices already include GST"
              hint={
                settings.tax.pricesIncludeTax
                  ? "A ₹89,999 product is being treated as ₹76,270 plus ₹13,729 tax — you are absorbing the GST. Your product pages say prices exclude GST, so this should almost certainly be off."
                  : "Correct for TechBro. GST is added on top of the listed price at checkout."
              }
              danger={settings.tax.pricesIncludeTax}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Default GST rate (%)"
              value={String(settings.tax.defaultGstRate)}
              error={errors["tax.defaultGstRate"]}
              onChange={(v) => setTax("defaultGstRate", Number(v))}
              numeric
            />
            <Field
              label="Default SAC code"
              value={settings.tax.defaultHsnCode ?? ""}
              onChange={(v) => setTax("defaultHsnCode", v)}
              hint="997331 — licensing services for the right to use software."
            />
          </div>

          <Toggle
            checked={settings.tax.roundOffTotal}
            onChange={(v) => setTax("roundOffTotal", v)}
            label="Round the invoice total to the nearest rupee"
            hint="Adds a round-off line. Standard practice on Indian invoices."
          />
        </div>
      </section>

      {formError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      )}
      {saved && (
        <p className="text-sm text-emerald-700">
          Saved. Applies to invoices issued from now on — existing invoices are
          immutable snapshots and are unaffected.
        </p>
      )}

      <button type="button" onClick={save} disabled={busy} className="btn-primary">
        {busy ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  hint,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  numeric?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.06em] text-ink-faint">
        {label}
      </span>
      <input
        type={numeric ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`field mt-1 ${error ? "field-error" : ""} ${numeric ? "tabular" : ""}`}
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-700">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  danger,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <label className="flex cursor-pointer gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-accent-deep"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span
          className={`mt-0.5 block text-xs leading-relaxed ${
            danger ? "text-red-700" : "text-ink-faint"
          }`}
        >
          {hint}
        </span>
      </span>
    </label>
  );
}
