"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Video } from "lucide-react";
import { APPOINTMENT_TOPICS, dateKeyInIndia, type AppointmentTopic } from "@/lib/appointments";

interface Slot {
  time: string;
  label: string;
  available: boolean;
}

const initialDate = dateKeyInIndia(new Date());

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
    return dateKeyInIndia(new Date(Date.now() + 6 * 24 * 60 * 60_000));
  }, []);
  const preferredDates = useMemo(() => [
    { label: "Today", offset: 0 },
    { label: "Tomorrow", offset: 1 },
    { label: "Day after", offset: 2 },
  ].map(({ label, offset }) => {
    const date = new Date(Date.now() + offset * 24 * 60 * 60_000);
    return {
      label,
      value: dateKeyInIndia(date),
      dateLabel: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(date),
    };
  }), []);

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
          <h2 className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl">Google Meet booked</h2>
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
    <form onSubmit={submit} className="editorial-form card overflow-hidden" noValidate>
      <div className="border-b border-rule-soft bg-paper-alt/60 px-3 py-3 sm:px-6 sm:py-4">
        <h2 className="font-display text-xl font-extrabold tracking-[-0.025em] text-ink sm:text-[1.4rem]">Schedule a Google Meet</h2>
        <p className="mt-0.5 font-sans text-xs font-normal tracking-[0.01em] text-ink-soft">30 minutes · Google Meet · Indian Standard Time</p>
      </div>

      <div className="space-y-3 p-3 sm:p-5 lg:p-5">
        <label className="block">
          <span className="label-muted">Consultation type</span>
          <select value={values.topic} onChange={(event) => set("topic", event.target.value)} className="field mt-1 h-10 text-base sm:text-sm">
            {Object.entries(APPOINTMENT_TOPICS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <div>
          <div className="flex items-center justify-between gap-3"><span className="label-muted">Preferred meeting days</span><span className="text-[10px] font-semibold text-ink-faint">Next 7 days only</span></div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {preferredDates.map((date) => (
              <button key={date.value} type="button" onClick={() => set("date", date.value)} className={`rounded-lg border px-2 py-2 text-center transition ${values.date === date.value ? "border-accent bg-accent text-white shadow-sm" : "border-blue-100 bg-blue-50/70 text-ink hover:border-accent"}`}>
                <strong className="block text-[11px] sm:text-xs">{date.label}</strong><span className={`mt-0.5 block text-[10px] ${values.date === date.value ? "text-white/75" : "text-ink-faint"}`}>{date.dateLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <label className="block">
            <span className="label-muted">Or choose another day</span>
            <input type="date" min={minDate} max={maxDate} value={values.date} onChange={(event) => set("date", event.target.value)} className={`field mt-1 h-10 min-w-0 text-sm ${errors.date ? "field-error" : ""}`} />
            {errors.date && <span className="mt-1 block text-xs text-accent-deep">{errors.date}</span>}
          </label>
          <div>
            <div className="flex items-center justify-between gap-2"><span className="label-muted">Available time</span>{slots.filter((slot) => slot.available).length > 16 && <span className="text-[9px] font-medium text-ink-faint">Scroll for more</span>}</div>
            <div className="mt-1 overflow-hidden rounded-xl border border-rule-soft bg-paper-alt/55 p-1.5 sm:mt-1.5" role="radiogroup" aria-label="Available appointment times">
              <div className="hide-scrollbar grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto overscroll-contain pr-0.5 sm:max-h-44">
                {loadingSlots ? <span className="col-span-full py-4 text-center text-xs text-ink-faint">Loading times…</span> : slots.filter((slot) => slot.available).map((slot) => (
                  <button key={slot.time} type="button" role="radio" aria-checked={values.time === slot.time} onClick={() => set("time", slot.time)} className={`min-h-8 whitespace-nowrap rounded-lg border px-1 py-1.5 text-[10px] font-bold transition sm:text-[11px] ${values.time === slot.time ? "border-accent bg-accent text-white shadow-sm" : "border-rule bg-white text-ink hover:border-accent hover:bg-blue-50"}`}>
                    {slot.label}
                  </button>
                ))}
                {!loadingSlots && slots.every((slot) => !slot.available) && <span className="col-span-full px-2 py-4 text-center text-xs leading-5 text-ink-faint">No times available. Choose another day within the next week.</span>}
              </div>
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

        <label className="block">
          <span className="label-muted">Project details <span className="text-accent-deep">*</span></span>
          <textarea required value={values.notes} onChange={(event) => set("notes", event.target.value)} rows={2} maxLength={2000} placeholder="Product, business goal and questions for the call" className={`field mt-1 !min-h-14 resize-y py-2 text-sm ${errors.notes ? "field-error" : ""}`} />
          {errors.notes && <span className="mt-1 block text-xs text-accent-deep">{errors.notes}</span>}
        </label>

        <div aria-hidden="true" className="absolute -left-[9999px]">
          <label>Company website<input tabIndex={-1} autoComplete="off" value={values.company_website} onChange={(event) => set("company_website", event.target.value)} /></label>
        </div>

        {formError && <p className="rounded-lg bg-accent-wash px-4 py-3 text-sm text-ink">{formError}</p>}

        <button type="submit" disabled={busy || loadingSlots || !values.time} className="btn-primary min-h-11 w-full text-base disabled:opacity-50 sm:min-h-12">
          <Clock3 size={17} /> {busy ? "Booking…" : "Confirm Google Meet"}
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
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className={`field mt-1 h-10 text-base sm:text-sm ${error ? "field-error" : ""}`} />
      {error && <span className="mt-1 block text-xs text-accent-deep">{error}</span>}
    </label>
  );
}
