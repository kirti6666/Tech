import mongoose, { Schema, models, model } from "mongoose";

/**
 * Industry — the primary taxonomy ("Fintech", "EdTech", "Healthcare").
 *
 * Replaces the base repo's generic Category. A product belongs to exactly
 * one industry, and every industry gets an SEO landing page at
 * /industry/[slug], so `description` is real page copy, not an admin note.
 *
 * `productCount` is denormalised for the browse tiles on the homepage —
 * recomputed by lib/taxonomy/recount.ts whenever a product is published,
 * unpublished or deleted. Never trust it for authorisation, only display.
 */

export interface IIndustry {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  displayOrder: number;
  productCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IndustrySchema = new Schema<IIndustry>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: { type: String },
    description: { type: String },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
    },
    displayOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

IndustrySchema.index({ displayOrder: 1, name: 1 });

export default models.Industry || model<IIndustry>("Industry", IndustrySchema);
