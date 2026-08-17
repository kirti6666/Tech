"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const initial = { name: "", email: "", phone: "", department: "Engineering", experience: "", portfolio: "", message: "" };

export function CareerApplicationForm() {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof initial, value: string) { setValues((current) => ({ ...current, [key]: value })); }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const details = [`Department: ${values.department}`, `Experience: ${values.experience}`, `Portfolio / résumé: ${values.portfolio || "Not provided"}`, "", values.message].join("\n");
    try {
      const response = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: values.name, email: values.email, phone: values.phone, company: values.department, source: "contact", requestType: "career_application", message: details }) });
      const data = await response.json();
      if (!response.ok) return setError(data.error ?? "Could not submit your application.");
      setSent(true); setValues(initial);
    } catch { setError("Could not reach the server. Please try again."); }
    finally { setBusy(false); }
  }

  if (sent) return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h2 className="mt-3 text-2xl font-extrabold text-ink">Application received</h2><p className="mt-2 text-sm text-ink-soft">We’ll review your details and contact you by email if there is a suitable opportunity.</p></div>;

  return <form id="apply" onSubmit={submit} className="rounded-2xl border border-rule bg-white p-4 shadow-lift sm:p-6">
    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-accent-deep">Join the team</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">Tell us about yourself</h2>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <Field label="Full name" required value={values.name} onChange={(v) => set("name", v)} />
      <Field label="Email" type="email" required value={values.email} onChange={(v) => set("email", v)} />
      <Field label="Phone" type="tel" value={values.phone} onChange={(v) => set("phone", v)} />
      <label><span className="label-muted">Department</span><select className="field mt-1" value={values.department} onChange={(e) => set("department", e.target.value)}><option>Engineering</option><option>Design</option><option>Marketing</option><option>Business Development</option><option>Customer Experience</option><option>Operations</option></select></label>
      <Field label="Experience" required placeholder="e.g. 3 years in product design" value={values.experience} onChange={(v) => set("experience", v)} />
      <Field label="Portfolio or résumé link" type="url" placeholder="https://" value={values.portfolio} onChange={(v) => set("portfolio", v)} />
      <label className="sm:col-span-2"><span className="label-muted">Why would you like to work with TechBro?</span><textarea required minLength={30} rows={4} className="field mt-1 resize-y" value={values.message} onChange={(e) => set("message", e.target.value)} placeholder="Tell us what you do best and the kind of work you want to take on." /></label>
    </div>
    {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="btn-primary mt-4 w-full sm:w-auto"><Send size={16} />{busy ? "Submitting…" : "Submit application"}</button>
  </form>;
}

function Field({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <label><span className="label-muted">{label}{required ? " *" : ""}</span><input className="field mt-1" required={required} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}
