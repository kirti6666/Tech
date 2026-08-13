import mongoose, { Schema, models, model } from "mongoose";
import {
  ADDON_TYPES,
  SERVICE_STATUSES,
  type AddonType,
  type ServiceStatus,
} from "@/types/catalog";

/**
 * ServiceRequest — the work queue behind a paid add-on.
 *
 * Created automatically by the payment webhook, one per add-on on the
 * order, in "pending" state with an empty `payload`. The customer then
 * fills the intake form (logo, colours, app name, domain) from their
 * dashboard, which populates `payload`.
 *
 * Deliberately created before the form is filled: the customer has paid,
 * so the obligation exists whether or not they get around to the form.
 * A pending request with an empty payload is a "chase the customer" item;
 * a pending request with a full payload is a "do the work" item.
 *
 * SECURITY: deployment payloads contain hosting credentials. Admin-only
 * read, and they should be purged once the request is delivered — see
 * the cleanup note in the build plan. Do not let this collection become
 * a long-term store of other people's server passwords.
 */

export interface IServiceStatusChange {
  status: ServiceStatus;
  at: Date;
  by?: mongoose.Types.ObjectId;
  note?: string;
}

export interface IServiceRequest {
  _id: string;
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product?: mongoose.Types.ObjectId;
  type: AddonType;
  status: ServiceStatus;

  payload: Record<string, unknown>;
  payloadSubmittedAt?: Date;
  payloadPurgedAt?: Date;

  adminNotes?: string;
  assignedTo?: mongoose.Types.ObjectId;
  history: IServiceStatusChange[];
  deliveredAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const StatusChangeSchema = new Schema<IServiceStatusChange>(
  {
    status: { type: String, enum: SERVICE_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String },
  },
  { _id: false }
);

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    type: { type: String, enum: ADDON_TYPES, required: true, index: true },
    status: {
      type: String,
      enum: SERVICE_STATUSES,
      default: "pending",
      index: true,
    },

    /**
     * Shape varies by type — rebranding: { logoUrl, colours, appName, domain };
     * deployment: { host, panelUrl, credentials, domain }. Loosely typed on
     * purpose; validate per-type with Zod at the route, not here.
     */
    payload: { type: Schema.Types.Mixed, default: {} },
    payloadSubmittedAt: { type: Date },
    payloadPurgedAt: { type: Date },

    adminNotes: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    history: { type: [StatusChangeSchema], default: [] },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

ServiceRequestSchema.index({ status: 1, createdAt: 1 });

export default models.ServiceRequest ||
  model<IServiceRequest>("ServiceRequest", ServiceRequestSchema);
