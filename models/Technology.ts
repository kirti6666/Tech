import mongoose, { Schema, models, model } from "mongoose";
import { TECH_CATEGORIES, type TechCategory } from "@/types/catalog";

/**
 * Technology — a stack tag ("React", "Laravel", "PostgreSQL").
 *
 * A product carries many of these. They do three jobs:
 *   1. chips on the product card, clickable into a filtered catalogue
 *   2. the multi-select filter on /shop
 *   3. SEO landing pages at /technology/[slug]
 *
 * `category` is what lets the product detail page render a proper
 * "Frontend / Backend / Database / Mobile" table instead of an
 * undifferentiated pile of logos — that separation was an explicit
 * requirement, and it comes from this field.
 */

export interface ITechnology {
  _id: string;
  name: string;
  slug: string;
  category: TechCategory;
  logo?: string;
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

const TechnologySchema = new Schema<ITechnology>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: TECH_CATEGORIES,
      required: true,
      default: "other",
    },
    logo: { type: String },
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

TechnologySchema.index({ category: 1, displayOrder: 1 });

export default models.Technology ||
  model<ITechnology>("Technology", TechnologySchema);
