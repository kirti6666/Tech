"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceField } from "@/lib/services/schemas";

/**
 * The intake form. Renders from the field definitions rather than
 * hand-written markup, so a field added to lib/services/schemas.ts appears
 * here and gets validated server-side without a second edit.
 *
 * Secret fields carry a visible line about what happens to the value and
 * when it's deleted. That isn't decoration — you're asking someone to type
 * a server password into a web form, and the honest thing is to say what
 * you'll do with it before they do.
 */
export function ServiceIntakeForm({
  requestId,
  intro,
  fields,
  initialValues,
  alreadySubmitted,
}: {
  requestId: string;
  intro: string;
  fields: ServiceField[];
  initialValues: Record<string, string>;
  alreadySubmitted: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setErrors({});
    setFormError(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/services/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: values }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Could not save your details.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const hasSecrets = fields.some((f) => f.secret);

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-ink-soft">{intro}</p>

      {hasSecrets && (
        <p className="rounded-lg bg-paper-alt px-4 py-3 text-xs leading-relaxed text-ink-soft">
          Credentials are encrypted before they're stored, only visible to the
          engineer doing your deployment, and deleted seven days after
          handover. Create a temporary account for us if you can, and remove
          it once we're done.
        </p>
      )}

      <div className="space-y-4">
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name] ?? ""}
            error={errors[field.name]}
            masked={alreadySubmitted && Boolean(field.secret)}
            onChange={(v) => setValues({ ...values, [field.name]: v })}
          />
        ))}
      </div>

      {formError && (
        <p className="rounded-lg bg-accent-wash px-4 py-3 text-sm text-ink">
          {formError}
        </p>
      )}
      {saved && (
        <p className="text-sm text-save">
          Saved. We&apos;ll be in touch — you can watch the status on your
          purchases page.
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="border border-accent-deep bg-accent-deep px-5 py-2.5 text-label font-medium uppercase tracking-[0.06em] text-white hover:bg-accent-deep hover:border-accent-deep disabled:opacity-60"
      >
        {busy ? "Saving…" : alreadySubmitted ? "Update details" : "Send details"}
      </button>
    </div>
  );
}

function Field({
  field,
  value,
  error,
  masked,
  onChange,
}: {
  field: ServiceField;
  value: string;
  error?: string;
  masked: boolean;
  onChange: (value: string) => void;
}) {
  const borderClass = error ? "border-accent-deep" : "border-rule";

  return (
    <label className="block">
      <span className="label-muted">
        {field.label} {field.required && <span className="text-accent-deep">*</span>}
      </span>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          className={`mt-1 w-full border ${borderClass} bg-paper px-3 py-2 text-sm`}
        />
      ) : field.type === "color" ? (
        <span className="mt-1 flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#1B5FCC"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-9 w-12 border border-rule bg-paper p-1"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="#1B5FCC"
            className={`w-32 border ${borderClass} bg-paper px-3 py-2 tabular text-sm`}
          />
        </span>
      ) : field.type === "file" ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className={`mt-1 w-full border ${borderClass} bg-paper px-3 py-2 text-sm`}
        />
      ) : (
        <input
          type={field.type === "password" ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={masked ? "•••••••• (leave blank to keep)" : field.placeholder}
          autoComplete={field.secret ? "off" : undefined}
          className={`mt-1 w-full border ${borderClass} bg-paper px-3 py-2 text-sm`}
        />
      )}

      {error ? (
        <span className="mt-1 block text-xs text-accent-deep">{error}</span>
      ) : field.help ? (
        <span className="mt-1 block text-xs text-ink-faint">{field.help}</span>
      ) : null}
    </label>
  );
}
