"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Video } from "lucide-react";
import { APPOINTMENT_TOPICS, type AppointmentTopic } from "@/lib/appointments";

interface Slot {
  time: string;
  label: string;
  available: boolean;
}

function dateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function firstBookableDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return date;
}

const initialDate = dateInputValue(firstBookableDate());

export function AppointmentForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    topic: "product_demo" as AppointmentTopic,
    date: initialDate,
    time: "",
    notes: "",
    company_website: "",
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    startAt: string;
    meetingUrl: string;
    warning?: string;
  } | null>(null);

  const minDate = initialDate;
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return dateInputValue(date);
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setSlots([]);
    fetch(`/api/appointments/availability?date=${encodeURIComponent(values.date)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load times.");
        if (active) {
          setSlots(data.slots ?? []);
          setFormError(null);
        }
      })
      .catch((error) => {
        if (active) setFormError(error.message);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [values.date]);

  function set(key: keyof typeof values, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "date" ? { time: "" } : {}),
    }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Could not book the appointment.");
        if (response.status === 409) {
          setValues((current) => ({ ...current, time: "" }));
        }
        return;
      }

      setConfirmation({
        startAt: data.appointment.startAt,
        meetingUrl: data.appointment.meetingUrl,
        warning: data.warning,
      });
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return (
      <section className="card overflow-hidden" aria-live="polite">
        <div className="bg-save/10 p-4 text-center sm:p-8">
          <CheckCircle2 className="mx-auto text-save" size={36} />
          <h2 className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl">Appointment confirmed</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {new Intl.DateTimeFormat("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "numeric",
              minute: "2-digit",
              timeZone: "Asia/Kolkata",
              timeZoneName: "short",
            }).format(new Date(confirmation.startAt))}
          </p>
        </div>
        <div className="p-4 text-center sm:p-6">
          <p className="text-sm leading-relaxed text-ink-soft">Meeting details and a calendar invitation have been sent to your email and to the TechBro team.</p>
          {confirmation.warning && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{confirmation.warning}</p>}
          <a href={confirmation.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 w-full sm:mt-5 sm:w-auto">
            <Video size={17} /> Join Google Meet
          </a>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="card overflow-hidden" noValidate>
      <div className="border-b border-rule-soft bg-paper-alt/60 px-3 py-3 sm:px-6 sm:py-4">
        <h2 className="font-display text-xl font-bold text-ink">Choose your consultation</h2>
        <p className="mt-0.5 text-xs text-ink-soft">30 minutes · Google Meet · Indian Standard Time</p>
      </div>

      <div className="space-y-3 p-3 sm:space-y-5 sm:p-6">
        <label className="block">
          <span className="label-muted">Consultation type</span>
          <select value={values.topic} onChange={(event) => set("topic", event.target.value)} className="field mt-1 text-base sm:mt-1.5 sm:text-sm">
            {Object.entries(APPOINTMENT_TOPICS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <label className="block">
            <span className="label-muted">Date</span>
            <span className="relative mt-1 block sm:mt-1.5">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
              <input type="date" min={minDate} max={maxDate} value={values.date} onChange={(event) => set("date", event.target.value)} className={`field pl-9 text-base sm:text-sm ${errors.date ? "field-error" : ""}`} />
            </span>
            {errors.date && <span className="mt-1 block text-xs text-accent-deep">{errors.date}</span>}
          </label>
          <div>
            <span className="label-muted">Available time</span>
            <div className="mt-1 grid grid-cols-4 gap-1.5 sm:mt-1.5 sm:grid-cols-3 sm:gap-2" role="radiogroup" aria-label="Available appointment times">
              {loadingSlots ? <span className="col-span-full py-3 text-xs text-ink-faint">Loading times…</span> : slots.filter((slot) => slot.available).map((slot) => (
                <button key={slot.time} type="button" role="radio" aria-checked={values.time === slot.time} onClick={() => set("time", slot.time)} className={`min-h-9 rounded-lg border px-1 py-1.5 text-[11px] font-semibold transition sm:px-2 sm:py-2 sm:text-xs ${values.time === slot.time ? "border-accent bg-accent text-white" : "border-rule bg-white text-ink hover:border-accent"}`}>
                  {slot.label}
                </button>
              ))}
              {!loadingSlots && slots.every((slot) => !slot.available) && <span className="col-span-full py-3 text-xs text-ink-faint">No times available. Choose another weekday.</span>}
            </div>
            {errors.time && <span className="mt-1 block text-xs text-accent-deep">{errors.time}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <Field label="Your name" value={values.name} onChange={(value) => set("name", value)} error={errors.name} autoComplete="name" required />
          <Field label="Email" type="email" value={values.email} onChange={(value) => set("email", value)} error={errors.email} autoComplete="email" required />
          <Field label="Phone" type="tel" value={values.phone} onChange={(value) => set("phone", value)} error={errors.phone} autoComplete="tel" required />
          <Field label="Company (optional)" value={values.company} onChange={(value) => set("company", value)} autoComplete="organization" />
        </div>

        <details className="rounded-lg border border-rule bg-paper-alt/40 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-ink">Add project details <span className="font-normal text-ink-faint">(optional)</span></summary>
          <label className="mt-3 block">
            <span className="label-muted">Anything we should prepare?</span>
            <textarea value={values.notes} onChange={(event) => set("notes", event.target.value)} rows={2} maxLength={2000} placeholder="Product name, goals or questions" className={`field mt-1 resize-y text-base sm:text-sm ${errors.notes ? "field-error" : ""}`} />
          </label>
        </details>

        <div aria-hidden="true" className="absolute -left-[9999px]">
          <label>Company website<input tabIndex={-1} autoComplete="off" value={values.company_website} onChange={(event) => set("company_website", event.target.value)} /></label>
        </div>

        {formError && <p className="rounded-lg bg-accent-wash px-4 py-3 text-sm text-ink">{formError}</p>}

        <button type="submit" disabled={busy || loadingSlots || !values.time} className="btn-primary min-h-11 w-full text-base disabled:opacity-50 sm:min-h-12">
          <Clock3 size={17} /> {busy ? "Booking…" : "Confirm appointment"}
        </button>
        <p className="text-center text-[11px] leading-tight text-ink-faint">You and the TechBro team receive the Google Meet link and calendar file by email.</p>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, error, type = "text", autoComplete, required }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-muted">{label}{required && <span className="text-accent-deep"> *</span>}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className={`field mt-1 py-2 text-base sm:mt-1.5 sm:py-2.5 sm:text-sm ${error ? "field-error" : ""}`} />
      {error && <span className="mt-1 block text-xs text-accent-deep">{error}</span>}
    </label>
  );
}
