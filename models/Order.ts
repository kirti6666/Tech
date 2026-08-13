import mongoose, { Schema, models, model } from "mongoose";
import {
  ADDON_TYPES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type AddonType,
  type OrderStatus,
  type PaymentStatus,
} from "@/types/catalog";

/**
 * Order — a digital purchase. No shipping, no quantity, no COD.
 *
 * Changes from the retail original:
 *   - shippingAddress/shippingFee removed entirely
 *   - `billing` added, with country + optional GSTIN (B2B) driving the
 *     tax treatment: intra-state CGST+SGST, inter-state IGST, export nil
 *   - orderStatus collapsed to pending/completed/refunded/cancelled —
 *     there is nothing between payment and delivery for a digital good
 *   - quantity dropped: buying two copies of the same licence is meaningless
 *   - `addons` are priced server-side at order creation, never from the client
 *
 * `deliveredAt` is set by the webhook confirmation path once licences exist.
 * An order that is paid but has no licences is a delivery failure and should
 * show up in an admin alert — not silently look fine.
 */

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  image?: string;
  packageId?: string;
  packageName?: string;
  /** Frozen at purchase time — later price changes must not rewrite history. */
  price: number;
  sacCode: string;
  gstRate: number;
}

export interface IOrderAddon {
  type: AddonType;
  label: string;
  price: number;
  product?: mongoose.Types.ObjectId;
}

export interface IBilling {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  /** GST state code, e.g. "27" for Maharashtra. Drives CGST/SGST vs IGST. */
  stateCode?: string;
  pincode?: string;
  country: string;
  gstin?: string;
}

export interface IOrder {
  _id: string;
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  addons: IOrderAddon[];
  billing: IBilling;

  subtotal: number;
  discount: number;
  couponCode?: string;
  taxTotal: number;
  total: number;
  currency: "INR" | "USD";

  gateway?: "razorpay" | "stripe";
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;

  orderStatus: OrderStatus;
  licenses: mongoose.Types.ObjectId[];
  deliveredAt?: Date;
  paidAt?: Date;
  refundedAt?: Date;
  refundReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String },
    packageId: { type: String },
    packageName: { type: String },
    price: { type: Number, required: true },
    sacCode: { type: String, required: true },
    gstRate: { type: Number, required: true },
  },
  { _id: false }
);

const OrderAddonSchema = new Schema<IOrderAddon>(
  {
    type: { type: String, enum: ADDON_TYPES, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
  },
  { _id: false }
);

const BillingSchema = new Schema<IBilling>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    stateCode: { type: String },
    pincode: { type: String },
    country: { type: String, required: true, default: "IN", uppercase: true },
    gstin: { type: String, uppercase: true, trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** Human-facing reference, e.g. TB-2026-000142. Generated in lib/orderNumber.ts. */
    orderNumber: { type: String, required: true, unique: true, index: true },

    items: { type: [OrderItemSchema], required: true },
    addons: { type: [OrderAddonSchema], default: [] },
    billing: { type: BillingSchema, required: true },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    taxTotal: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, enum: ["INR", "USD"], default: "INR" },

    gateway: { type: String, enum: ["razorpay", "stripe"] },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      index: true,
    },
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String },
    stripeSessionId: { type: String, index: true, sparse: true },
    stripePaymentIntentId: { type: String },

    orderStatus: { type: String, enum: ORDER_STATUSES, default: "pending" },
    licenses: [{ type: Schema.Types.ObjectId, ref: "License" }],
    deliveredAt: { type: Date },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    refundReason: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ user: 1, createdAt: -1 });
/** Admin alert query: paid but never delivered. */
OrderSchema.index({ paymentStatus: 1, deliveredAt: 1 });

export default models.Order || model<IOrder>("Order", OrderSchema);
