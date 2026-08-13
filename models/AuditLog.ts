import mongoose, { Schema, models, model } from "mongoose";

export type AuditAction =
  | "LOGIN"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE"
  | "REVIEW_MODERATE"
  | "CATEGORY_CREATE"
  | "CATEGORY_UPDATE"
  | "CATEGORY_DELETE"
  | "ORDER_STATUS_UPDATE"
  | "COUPON_CREATE"
  | "COUPON_UPDATE"
  | "COUPON_DELETE"
  | "SETTINGS_UPDATE"
  // Digital-marketplace actions. LICENSE_REVEAL and SERVICE_CREDENTIALS_REVEAL
  // exist because reading a customer's credentials should leave a trace even
  // when it's entirely legitimate — an audit log that only records mistakes
  // tells you nothing about the normal case it should be compared against.
  | "LICENSE_REVOKE"
  | "LICENSE_REINSTATE"
  | "LICENSE_REGENERATE"
  | "LICENSE_LIMIT_UPDATE"
  | "ORDER_REFUND"
  | "SERVICE_UPDATE"
  | "SERVICE_CREDENTIALS_REVEAL"
  | "SERVICE_CREDENTIALS_PURGE"
  | "PRODUCT_SOURCE_UPLOAD";

export interface IAuditLog {
  _id: string;
  admin: mongoose.Types.ObjectId;
  action: AuditAction;
  targetType?:
    | "Product"
    | "Order"
    | "Category"
    | "Coupon"
    | "Review"
    | "User"
    | "License"
    | "ServiceRequest"
    | "Industry"
    | "Technology";
  targetId?: mongoose.Types.ObjectId;
  changes?: Record<string, unknown>; // e.g. { before: {...}, after: {...} }
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    changes: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Descending index so the activity feed loads newest-first quickly
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ admin: 1 });

export default models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
