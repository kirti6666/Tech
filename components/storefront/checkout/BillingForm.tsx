"use client";

import { INDIAN_STATES } from "@/lib/states";

export interface BillingDetails {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstin: string;
}

export const EMPTY_BILLING: BillingDetails = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "IN",
  gstin: "",
};

/**
 * Billing details. No shipping fields — nothing is posted.
 *
 * State is a select rather than a text input because it decides whether the
 * invoice shows CGST+SGST or IGST, and "Maharastra" typed by hand doesn't
 * map to a GST state code. For buyers outside India the state and GSTIN
 * fields disappear entirely: neither applies, and asking for them invites
 * someone to fill them in wrongly.
 */
export function BillingForm({
  value,
  errors,
  onChange,
}: {
  value: BillingDetails;
  errors: Record<string, string>;
  onChange: (next: BillingDetails) => void;
}) {
  const isIndia = value.country === "IN";

  function set<K extends keyof BillingDetails>(key: K, next: BillingDetails[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-rule-soft px-4 py-3 sm:px-5 sm:py-4">
        <p className="label">Step 2</p>
        <h2 className="mt-0.5 text-lg font-bold text-ink">Billing and invoice details</h2>
      </div>

      <div className="grid gap-2.5 p-3 sm:grid-cols-2 sm:gap-3 sm:p-5">
        <Field
          label="Full name"
          error={errors.name}
          value={value.name}
          onChange={(v) => set("name", v)}
          autoComplete="name"
          required
        />
        <Field
          label="Email"
          type="email"
          error={errors.email}
          value={value.email}
          onChange={(v) => set("email", v)}
          autoComplete="email"
          hint="Your licence key and download link go here."
          required
        />
        <Field
          label="Phone"
          type="tel"
          error={errors.phone}
          value={value.phone}
          onChange={(v) => set("phone", v)}
          autoComplete="tel"
          required
        />

        <label className="block">
          <span className="label-muted">Country</span>
          <select
            value={value.country}
            onChange={(e) => {
              const country = e.target.value;
              // Clear the India-only fields so a stale state code can't
              // survive a switch to an export order.
              onChange({
                ...value,
                country,
                state: country === "IN" ? value.state : "",
                gstin: country === "IN" ? value.gstin : "",
              });
            }}
            className="field mt-1 h-10"
          >
            <option value="IN">India</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="AE">United Arab Emirates</option>
            <option value="AU">Australia</option>
            <option value="CA">Canada</option>
            <option value="SG">Singapore</option>
            <option value="OTHER">Elsewhere</option>
          </select>
        </label>

        <div className="sm:col-span-2">
          <Field
            label="Address"
            error={errors.addressLine1}
            value={value.addressLine1}
            onChange={(v) => set("addressLine1", v)}
            autoComplete="address-line1"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Address line 2"
            value={value.addressLine2}
            onChange={(v) => set("addressLine2", v)}
            autoComplete="address-line2"
          />
        </div>

        <Field
          label="City"
          error={errors.city}
          value={value.city}
          onChange={(v) => set("city", v)}
          autoComplete="address-level2"
          required
        />

        {isIndia ? (
          <label className="block">
            <span className="label-muted">
              State <span className="text-accent-deep">*</span>
            </span>
            <select
              value={value.state}
              onChange={(e) => set("state", e.target.value)}
              className="field mt-1 h-10"
            >
              <option value="">Select a state</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
            {errors.state ? (
              <span className="mt-1 block text-xs text-accent-deep">{errors.state}</span>
            ) : (
              <span className="mt-1 block text-xs text-ink-faint">
                Sets how GST is split on your invoice.
              </span>
            )}
          </label>
        ) : (
          <Field
            label="State or region"
            value={value.state}
            onChange={(v) => set("state", v)}
            autoComplete="address-level1"
          />
        )}

        <Field
          label={isIndia ? "PIN code" : "Postal code"}
          value={value.pincode}
          onChange={(v) => set("pincode", v)}
          autoComplete="postal-code"
        />

        {isIndia && (
          <Field
            label="GSTIN (optional)"
            error={errors.gstin}
            value={value.gstin}
            onChange={(v) => set("gstin", v.toUpperCase())}
            hint="Add it to claim input tax credit on this purchase."
          />
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-muted">
        {label} {required && <span className="text-accent-deep">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={`field mt-1 h-10 ${error ? "field-error" : ""}`}
      />
      {error ? (
        <span className="mt-1 block text-xs text-accent-deep">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}
