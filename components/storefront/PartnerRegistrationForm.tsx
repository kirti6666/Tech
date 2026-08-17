"use client";

import { useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Send, Target, UserRound } from "lucide-react";

const initial = {
  name: "",
  email: "",
  phone: "",
  city: "",
  occupation: "",
  partnershipType: "",
  experience: "",
  message: "",
};

export function PartnerRegistrationForm() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  function set(key: keyof typeof initial, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) next.email = "Enter a valid email.";
    if (!values.phone.trim()) next.phone = "Enter your phone number.";
    if (!values.city.trim()) next.city = "Enter your city.";
    if (!values.occupation.trim()) next.occupation = "Tell us what you do.";
    if (!values.partnershipType) next.partnershipType = "Choose how you want to partner.";
    if (values.message.trim().length < 30) next.message = "Explain your plan in at least 30 characters.";
    if (Object.keys(next).length) return setErrors(next);

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/partner-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company_website: "" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fields ?? {});
        setMessage(data.error ?? "Could not submit your application.");
        return;
      }
      setSent(true);
      setValues(initial);
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 font-display text-2xl font-black tracking-[-0.025em] text-ink">Application received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">We emailed your confirmation. The TechBro team will review your plan and contact you with the next steps.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lift">
      <header className="flex items-start justify-between gap-4 border-b border-blue-100 bg-gradient-to-r from-blue-50/90 to-white px-3.5 py-3 sm:px-5">
        <div><p className="label-muted">Partner application</p><h2 className="mt-1 font-display text-xl font-black leading-tight tracking-[-0.025em] text-ink sm:text-2xl">Tell us how you want to work with TechBro</h2></div>
        <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 sm:inline-flex">Free to apply</span>
      </header>
      <div className="space-y-3 p-3 sm:p-5">
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-deep"><UserRound size={14} /> Contact details</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className="col-span-2 sm:col-span-1"><Field label="Full name" value={values.name} onChange={(value) => set("name", value)} error={errors.name} required /></div>
        <div className="col-span-2 sm:col-span-1"><Field label="Email" type="email" value={values.email} onChange={(value) => set("email", value)} error={errors.email} required /></div>
        <Field label="Phone" type="tel" value={values.phone} onChange={(value) => set("phone", value)} error={errors.phone} required />
        <Field label="City" value={values.city} onChange={(value) => set("city", value)} error={errors.city} required />
        </div>
      </fieldset>

      <fieldset className="border-t border-rule-soft pt-3">
        <legend className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-deep"><BriefcaseBusiness size={14} /> Professional profile</legend>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <Field label="Profession or business" value={values.occupation} onChange={(value) => set("occupation", value)} error={errors.occupation} required />
        <label className="block">
          <span className="label-muted">How do you want to partner? <span className="text-accent-deep">*</span></span>
          <select required value={values.partnershipType} onChange={(event) => set("partnershipType", event.target.value)} className={`field mt-1 h-10 text-base sm:text-sm ${errors.partnershipType ? "field-error" : ""}`}>
            <option value="">Select an option</option>
            <option value="refer_clients">Refer clients to TechBro</option>
            <option value="sell_products">Sell TechBro products</option>
            <option value="both">Refer clients and sell products</option>
          </select>
          {errors.partnershipType && <span className="mt-1 block text-xs text-red-700">{errors.partnershipType}</span>}
        </label>
        <div className="sm:col-span-2">
          <Field label="Relevant experience or network" value={values.experience} onChange={(value) => set("experience", value)} placeholder="Optional: industries, audience or sales experience" />
        </div>
        </div>
      </fieldset>

      <fieldset className="border-t border-rule-soft pt-3">
        <legend className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-deep"><Target size={14} /> Your plan</legend>
        <label className="block sm:col-span-2">
          <span className="label-muted">How will you find clients and sell our products? <span className="text-accent-deep">*</span></span>
          <textarea required rows={3} maxLength={2000} value={values.message} onChange={(event) => set("message", event.target.value)} placeholder="Briefly explain your approach, target customers and how you plan to promote TechBro." className={`field mt-1 resize-y py-2 text-base sm:text-sm ${errors.message ? "field-error" : ""}`} />
          {errors.message && <span className="mt-1 block text-xs text-red-700">{errors.message}</span>}
        </label>
      </fieldset>
      </div>
      <div className="border-t border-blue-100 bg-paper-alt/40 p-3 sm:px-5">
        {message && <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
        <button type="submit" disabled={busy} className="btn-primary h-11 w-full sm:w-auto"><Send size={16} />{busy ? "Submitting…" : "Submit partner application"}</button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, error, type = "text", required, placeholder }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label-muted">{label} {required && <span className="text-accent-deep">*</span>}</span>
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`field mt-1 h-10 text-base sm:text-sm ${error ? "field-error" : ""}`} />
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}
