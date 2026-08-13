import mongoose, { Schema, models, model } from "mongoose";

/**
 * Enquiry — contact form and custom-work lead capture.
 *
 * Kept separate from ServiceRequest on purpose: an enquiry is from
 * someone who has not paid and may not have an account, so it has no
 * order, no user requirement, and a sales pipeline status rather than a
 * fulfilment status.
 */

export interface IEnquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source: "contact" | "custom_work";
  /** Which product page they were on, if any. Useful signal for follow-up. */
  productContext?: mongoose.Types.ObjectId;
  budget?: string;
  status: "new" | "contacted" | "converted" | "closed";
  adminNotes?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    message: { type: String, required: true, maxlength: 5000 },
    source: {
      type: String,
      enum: ["contact", "custom_work"],
      required: true,
      index: true,
    },
    productContext: { type: Schema.Types.ObjectId, ref: "Product" },
    budget: { type: String },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new",
      index: true,
    },
    adminNotes: { type: String },
    /** Stored for spam triage only — rate-limit the public endpoint too. */
    ip: { type: String },
  },
  { timestamps: true }
);

EnquirySchema.index({ createdAt: -1 });

export default models.Enquiry || model<IEnquiry>("Enquiry", EnquirySchema);
