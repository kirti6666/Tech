"use client";

import { useState } from "react";
import { CheckCircle2, Link2, PackageCheck, Send, UserRound } from "lucide-react";

const initial = { name: "", email: "", phone: "", projectName: "", submissionType: "Source code product", liveUrl: "", repositoryUrl: "", askingPrice: "", description: "", ownsRights: false };

export function InnovationSubmissionForm() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) next.email = "Enter a valid email.";
    if (!values.projectName.trim()) next.projectName = "Enter the product or innovation name.";
    if (!isValidWebUrl(values.liveUrl)) next.liveUrl = "Enter a valid live demo link.";
    if (!isValidWebUrl(values.repositoryUrl)) next.repositoryUrl = "Enter a valid repository link.";
    if (values.description.trim().length < 40) next.description = "Describe the product in at least 40 characters.";
    if (!values.ownsRights) next.ownsRights = "Confirm that you own the rights to submit it.";
    if (Object.keys(next).length) return setErrors(next);

    setBusy(true);
    setMessage("");
    try {
      const details = [
        `Product / innovation: ${values.projectName}`,
        `Submission type: ${values.submissionType}`,
        `Live demo: ${values.liveUrl}`,
        `Repository / portfolio: ${values.repositoryUrl}`,
        values.askingPrice ? `Expected commercial terms: ${values.askingPrice}` : "",
        "", "Product details:", values.description, "",
        "Rights declaration: The submitter confirmed they own or control the rights required to offer this work.",
      ].filter(Boolean).join("\n");

      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, email: values.email, phone: values.phone, company: values.projectName, budget: values.askingPrice, source: "custom_work", requestType: "innovation_submission", liveUrl: values.liveUrl, repositoryUrl: values.repositoryUrl, message: details }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fields ?? {});
        setMessage(data.error ?? "Could not submit your product.");
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

  if (sent) return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h2 className="mt-3 font-sans text-2xl font-extrabold tracking-tight text-ink">Submission received</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">Our team will review your product, ownership information and commercial proposal, then reply by email.</p></div>;

  return (
    <form onSubmit={submit} noValidate className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lift">
      <header className="flex items-start justify-between gap-4 border-b border-blue-100 bg-gradient-to-r from-blue-50/80 to-white px-4 py-3.5 sm:px-5">
        <div><p className="label-muted">Confidential review</p><h2 className="mt-1 font-sans text-xl font-extrabold tracking-tight text-ink sm:text-2xl">Tell us what you built</h2></div>
        <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 sm:inline-flex">No listing fee</span>
      </header>

      <div className="space-y-3 p-3 sm:p-5">
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-deep"><UserRound size={14} /> Contact details</legend>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <Field label="Your name" value={values.name} onChange={(v) => set("name", v)} error={errors.name} required />
        <Field label="Email" type="email" value={values.email} onChange={(v) => set("email", v)} error={errors.email} required />
        <Field label="Phone" type="tel" value={values.phone} onChange={(v) => set("phone", v)} />
        <Field label="Product or innovation name" value={values.projectName} onChange={(v) => set("projectName", v)} error={errors.projectName} required />
        </div>
      </fieldset>

      <fieldset className="border-t border-rule-soft pt-3">
        <legend className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-deep"><PackageCheck size={14} /> Product and terms</legend>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <label className="block"><span className="label-muted">What are you offering?</span><select value={values.submissionType} onChange={(e) => set("submissionType", e.target.value)} className="field mt-1 h-10 text-base sm:text-sm"><option>Source code product</option><option>Website or web application</option><option>Mobile application</option><option>SaaS product</option><option>AI tool or automation</option><option>Other innovation</option></select></label>
        <Field label="Expected price or partnership" value={values.askingPrice} onChange={(v) => set("askingPrice", v)} />
        </div>
      </fieldset>

      <fieldset className="border-t border-rule-soft pt-3">
        <legend className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-deep"><Link2 size={14} /> Product proof</legend>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <Field label="Live demo link" type="url" value={values.liveUrl} onChange={(v) => set("liveUrl", v)} error={errors.liveUrl} placeholder="https://" required />
        <Field label="Repository link" type="url" value={values.repositoryUrl} onChange={(v) => set("repositoryUrl", v)} error={errors.repositoryUrl} placeholder="https://github.com/…" required />
        </div>
      </fieldset>

      <fieldset className="border-t border-rule-soft pt-3">
        <legend className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-deep">Product overview</legend>
        <label className="block"><span className="label-muted">Tell us about the product <span className="text-accent-deep">*</span></span><textarea rows={3} maxLength={5000} value={values.description} onChange={(e) => set("description", e.target.value)} placeholder="What it does, who it is for, its technology, users or revenue, and why it is valuable." className={`field mt-1 resize-y py-2 text-base sm:text-sm ${errors.description ? "field-error" : ""}`} />{errors.description && <span className="mt-1 block text-xs text-accent-deep">{errors.description}</span>}</label>
      </fieldset>
      </div>
      <div className="border-t border-blue-100 bg-paper-alt/40 p-3 sm:px-5">
        <label className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-sm leading-5 ${errors.ownsRights ? "border-red-300 bg-red-50" : "border-rule bg-white"}`}><input type="checkbox" checked={values.ownsRights} onChange={(e) => set("ownsRights", e.target.checked)} className="mt-0.5 h-4 w-4 accent-accent-deep" /><span>I confirm that I own or control the rights required to commercially offer this work.</span></label>
        {errors.ownsRights && <span className="mt-1 block text-xs text-red-700">{errors.ownsRights}</span>}
        {message && <p className="mt-3 rounded-lg bg-accent-wash px-4 py-3 text-sm text-ink">{message}</p>}
        <button type="submit" disabled={busy} className="btn-primary mt-3 h-11 w-full sm:w-auto"><Send size={16} />{busy ? "Submitting…" : "Submit for review"}</button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, error, type = "text", required, placeholder }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="block"><span className="label-muted">{label} {required && <span className="text-accent-deep">*</span>}</span><input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`field mt-1 h-10 text-base sm:text-sm ${error ? "field-error" : ""}`} />{error && <span className="mt-1 block text-xs text-accent-deep">{error}</span>}</label>;
}

function isValidWebUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
