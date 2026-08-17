import { Schema, model, models } from "mongoose";

export interface IPartnerLead {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  city?: string;
  occupation?: string;
  partnershipType?: "refer_clients" | "sell_products" | "both";
  experience?: string;
  message?: string;
  source: "welcome_popup" | "partner_page";
  status: "new" | "contacted" | "approved" | "declined";
  adminNotes?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerLeadSchema = new Schema<IPartnerLead>(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    occupation: { type: String, trim: true },
    partnershipType: {
      type: String,
      enum: ["refer_clients", "sell_products", "both"],
    },
    experience: { type: String, trim: true },
    message: { type: String, trim: true },
    source: {
      type: String,
      enum: ["welcome_popup", "partner_page"],
      default: "partner_page",
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "approved", "declined"],
      default: "new",
      index: true,
    },
    adminNotes: { type: String, trim: true },
    ip: { type: String },
  },
  { timestamps: true }
);

PartnerLeadSchema.index({ createdAt: -1 });

export default models.PartnerLead ||
  model<IPartnerLead>("PartnerLead", PartnerLeadSchema);
