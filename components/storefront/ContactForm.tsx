"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * One form, two jobs: general contact and custom-build enquiries. The
 * budget field only appears for custom work, because asking a support
 * question shouldn't come with a price bracket.
 *
 * `company_website` is the honeypot — hidden from people, irresistible to
 * form-filling bots. It's hidden with an off-screen position rather than
 * display:none, since some bots skip fields that aren't laid out, and
 * aria-hidden plus tabIndex keeps it away from screen readers and keyboard
 * users.
 */
export function ContactForm() {
  const searchParams = useSearchParams();
  const isCustomWork = searchParams.get("type") === "custom";

  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    budget: "",
    message: "",
    company_website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof values, value: string) {
    setValues({ ...values, [key]: value });
  }

  async function submit() {
    setBusy(true);
    setErrors({});
    setFormError(null);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          source: isCustomWork ? "custom_work" : "contact",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Could not send your message.");
        return;
      }

      setSent(true);
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-rule px-6 py-12 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          Message sent
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          We&apos;ll read it properly and reply within one working day. Check
          your inbox for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Your name"
          value={values.name}
          error={errors.name}
          onChange={(v) => set("name", v)}
          required
        />
        <Field
          label="Email"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(v) => set("email", v)}
          required
        />
        <Field
          label="Phone"
          type="tel"
          value={values.phone}
          onChange={(v) => set("phone", v)}
        />
        <Field
          label="Company"
          value={values.company}
          onChange={(v) => set("company", v)}
        />
      </div>

      {isCustomWork && (
        <label className="block">
          <span className="label-muted">Rough budget</span>
          <select
            value={values.budget}
            onChange={(e) => set("budget", e.target.value)}
            className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-sm"
          >
            <option value="">Not sure yet</option>
            <option value="under-1L">Under ₹1 lakh</option>
            <option value="1-3L">₹1–3 lakh</option>
            <option value="3-10L">₹3–10 lakh</option>
            <option value="over-10L">Over ₹10 lakh</option>
          </select>
          <span className="mt-1 block text-xs text-ink-faint">
            A range is fine — it helps us suggest something realistic.
          </span>
        </label>
      )}

      <label className="block">
        <span className="label-muted">
          {isCustomWork ? "What do you want built" : "Message"}{" "}
          <span className="text-accent-deep">*</span>
        </span>
        <textarea
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          rows={6}
          maxLength={5000}
          placeholder={
            isCustomWork
              ? "What the product needs to do, who uses it, and anything it has to connect to."
              : "How can we help?"
          }
          className={`mt-1 w-full border bg-paper px-3 py-2 text-sm ${
            errors.message ? "border-accent-deep" : "border-rule"
          }`}
        />
        {errors.message && (
          <span className="mt-1 block text-xs text-accent-deep">{errors.message}</span>
        )}
      </label>

      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: "auto" }}
      >
        <label>
          Company website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.company_website}
            onChange={(e) => set("company_website", e.target.value)}
          />
        </label>
      </div>

      {formError && (
        <p className="rounded-lg bg-accent-wash px-4 py-3 text-sm text-ink">
          {formError}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="border border-accent-deep bg-accent-deep px-5 py-2.5 text-label font-medium uppercase tracking-[0.06em] text-white hover:bg-accent-deep hover:border-accent-deep disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
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
        className={`mt-1 w-full border bg-paper px-3 py-2 text-sm ${
          error ? "border-accent-deep" : "border-rule"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-accent-deep">{error}</span>}
    </label>
  );
}
