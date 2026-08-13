import { Schema, models, model } from "mongoose";
import { ADDON_TYPES, DEFAULT_SAC_CODE } from "@/types/catalog";

/**
 * AddonSettings — admin-editable prices for the three services offered at
 * checkout.
 *
 * A singleton, like InvoiceSettings, and deliberately its own document
 * rather than another section bolted onto SiteSettings: these are prices
 * that appear on tax invoices, so they want their own admin screen, their
 * own audit trail, and no chance of being changed by accident while someone
 * is editing the homepage hero text.
 *
 * The prices live here rather than in code so you can run a launch offer
 * without a deploy. Nothing reads them from the client — the checkout quote
 * and the order both recompute from this document.
 */

const AddonSchema = new Schema(
  {
    type: { type: String, enum: ADDON_TYPES, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    sacCode: { type: String, default: DEFAULT_SAC_CODE },
    gstRate: { type: Number, default: 18 },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const AddonSettingsSchema = new Schema(
  {
    singletonKey: { type: String, default: "addons", unique: true },
    addons: { type: [AddonSchema], default: [] },
  },
  { timestamps: true }
);

export default models.AddonSettings ||
  model("AddonSettings", AddonSettingsSchema);
