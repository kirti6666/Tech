export const APPOINTMENT_TIMEZONE = "Asia/Kolkata" as const;
export const APPOINTMENT_DURATION_MINUTES = 30;
export const APPOINTMENT_TOPICS = {
  product_demo: "Product demo",
  custom_project: "Custom project consultation",
  technical_consultation: "Technical consultation",
} as const;

export type AppointmentTopic = keyof typeof APPOINTMENT_TOPICS;

export interface AppointmentSlot {
  time: string;
  label: string;
  available: boolean;
}

const SLOT_TIMES = Array.from({ length: 16 }, (_, index) => {
  const minutes = 10 * 60 + index * APPOINTMENT_DURATION_MINUTES;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

export function appointmentStart(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+05:30`);
}

export function appointmentEnd(start: Date): Date {
  return new Date(start.getTime() + APPOINTMENT_DURATION_MINUTES * 60_000);
}

export function dateKeyInIndia(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APPOINTMENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function isBookableDate(dateKey: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const start = appointmentStart(dateKey, "00:00");
  if (Number.isNaN(start.getTime())) return false;

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60_000);
  const max = new Date(now.getTime() + 31 * 24 * 60 * 60_000);
  // Noon in India falls on the same UTC calendar date. Midnight does not,
  // which would incorrectly classify Mondays as Sundays.
  const day = appointmentStart(dateKey, "12:00").getUTCDay();
  return dateKey >= dateKeyInIndia(tomorrow) && start <= max && day !== 0 && day !== 6;
}

export function availableSlots(dateKey: string, booked: Date[]): AppointmentSlot[] {
  const bookedTimes = new Set(booked.map((date) => date.getTime()));
  return SLOT_TIMES.map((time) => {
    const start = appointmentStart(dateKey, time);
    return {
      time,
      label: new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: APPOINTMENT_TIMEZONE,
      }).format(start),
      available: !bookedTimes.has(start.getTime()),
    };
  });
}

export function isValidSlotTime(time: string): boolean {
  return SLOT_TIMES.includes(time);
}

export function formatAppointmentDate(start: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: APPOINTMENT_TIMEZONE,
    timeZoneName: "short",
  }).format(start);
}
