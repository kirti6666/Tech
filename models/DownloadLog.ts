import mongoose, { Schema, models, model } from "mongoose";

/**
 * DownloadLog — append-only record of every signed URL issued.
 *
 * Written on issue, not on completion: a URL that was handed out has
 * already left your control, whether or not the transfer finished. This
 * is your evidence trail if source code turns up somewhere it shouldn't,
 * so nothing here is ever updated or deleted.
 *
 * Also worth logging denials (limit exceeded, revoked licence) — a burst
 * of those is what a shared-account or scraped-link problem looks like
 * before it becomes obvious.
 */

export interface IDownloadLog {
  _id: string;
  license: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  outcome: "issued" | "denied_limit" | "denied_revoked" | "denied_forbidden";
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const DownloadLogSchema = new Schema<IDownloadLog>(
  {
    license: {
      type: Schema.Types.ObjectId,
      ref: "License",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    outcome: {
      type: String,
      enum: ["issued", "denied_limit", "denied_revoked", "denied_forbidden"],
      required: true,
      index: true,
    },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

DownloadLogSchema.index({ createdAt: -1 });

export default models.DownloadLog ||
  model<IDownloadLog>("DownloadLog", DownloadLogSchema);
