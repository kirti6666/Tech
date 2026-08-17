"use client";

import { useState } from "react";
import { CheckCircle2, PhoneCall, Send } from "lucide-react";

const initialValues = {
  name: "",
  email: "",
  phone: "",
  details: "",
};

export function QuickCallForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function set(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = "Enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) nextErrors.email = "Enter a valid email.";
    if (!values.phone.trim()) nextErrors.phone = "Enter your phone number.";
    if (!values.details.trim()) nextErrors.details = "Tell us what you would like to discuss.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          source: "custom_work",
          requestType: "quick_call",
          message: `Quick call discussion details:\n${values.details}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fields ?? {});
        setMessage(data.error ?? "Could not request the call.");
        return;
      }
      setSent(true);
      setValues(initialValues);
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <section id="quick-call" className="scroll-mt-24 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center shadow-card sm:p-7" aria-live="polite">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-2 font-display text-xl font-bold text-ink">Callback request sent</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">Your contact and discussion details have been emailed to the TechBro team. We’ll contact you directly.</p>
      </section>
    );
  }

  return (
    <section id="quick-call" className="scroll-mt-24 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#061a3a] to-[#123b78] shadow-lift" aria-labelledby="quick-call-heading">
      <div className="grid gap-0 lg:grid-cols-[.8fr_1.2fr]">
        <div className="flex flex-col justify-center p-4 text-white sm:p-6 lg:p-8">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"><PhoneCall className="h-5 w-5" aria-hidden="true" /></span>
          <p className="mt-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">No appointment needed</p>
          <h2 id="quick-call-heading" className="mt-2 font-brand text-3xl font-bold leading-none tracking-[-0.025em]">Request a quick call</h2>
          <p className="mt-3 font-sans text-sm font-normal leading-6 text-blue-100/75">Share your number and what you want to discuss. Your details go directly to the admin Gmail inbox.</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-2.5 bg-white p-3 sm:p-5">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <QuickField label="Name" value={values.name} onChange={(value) => set("name", value)} error={errors.name} autoComplete="name" />
            <QuickField label="Phone" type="tel" value={values.phone} onChange={(value) => set("phone", value)} error={errors.phone} autoComplete="tel" />
          </div>
          <QuickField label="Email" type="email" value={values.email} onChange={(value) => set("email", value)} error={errors.email} autoComplete="email" />
          <label className="block"><span className="label-muted">Discussion details <span className="text-accent-deep">*</span></span><textarea rows={2} maxLength={5000} value={values.details} onChange={(event) => set("details", event.target.value)} placeholder="What would you like to discuss?" className={`field mt-1 resize-y py-2 text-base sm:text-sm ${errors.details ? "field-error" : ""}`} />{errors.details && <span className="mt-1 block text-xs text-accent-deep">{errors.details}</span>}</label>
          {message && <p className="rounded-lg bg-accent-wash px-3 py-2 text-xs text-ink">{message}</p>}
          <button type="submit" disabled={busy} className="btn-primary min-h-11 w-full text-sm disabled:opacity-50"><Send className="h-4 w-4" aria-hidden="true" />{busy ? "Sending…" : "Request a quick call"}</button>
        </form>
      </div>
    </section>
  );
}

function QuickField({ label, value, onChange, error, type = "text", autoComplete }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; autoComplete?: string }) {
  return <label className="block"><span className="label-muted">{label} <span className="text-accent-deep">*</span></span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className={`field mt-1 h-10 text-base sm:text-sm ${error ? "field-error" : ""}`} />{error && <span className="mt-1 block text-xs text-accent-deep">{error}</span>}</label>;
}
