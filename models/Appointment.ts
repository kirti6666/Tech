import { Schema, model, models } from "mongoose";

export const APPOINTMENT_STATUSES = [
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface IAppointment {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  topic: "product_demo" | "custom_project" | "technical_consultation";
  notes?: string;
  startAt: Date;
  endAt: Date;
  timezone: "Asia/Kolkata";
  meetingUrl: string;
  googleMeetSpaceName?: string;
  status: AppointmentStatus;
  blocksSlot: boolean;
  customerEmailSentAt?: Date;
  adminEmailSentAt?: Date;
  cancellationReason?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true, maxlength: 30 },
    company: { type: String, trim: true, maxlength: 120 },
    topic: {
      type: String,
      enum: ["product_demo", "custom_project", "technical_consultation"],
      required: true,
      index: true,
    },
    notes: { type: String, maxlength: 2000 },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    timezone: { type: String, enum: ["Asia/Kolkata"], default: "Asia/Kolkata" },
    meetingUrl: { type: String, required: true },
    googleMeetSpaceName: { type: String, trim: true },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: "confirmed",
      index: true,
    },
    blocksSlot: { type: Boolean, default: true },
    customerEmailSentAt: { type: Date },
    adminEmailSentAt: { type: Date },
    cancellationReason: { type: String, maxlength: 500 },
    ip: { type: String },
  },
  { timestamps: true }
);

// The partial unique index makes slot reservation atomic while allowing a
// cancelled appointment to release the time for a future booking.
AppointmentSchema.index(
  { startAt: 1 },
  { unique: true, partialFilterExpression: { blocksSlot: true } }
);
AppointmentSchema.index({ status: 1, startAt: 1 });

export default models.Appointment ||
  model<IAppointment>("Appointment", AppointmentSchema);
