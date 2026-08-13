import mongoose, { Schema, models, model } from "mongoose";
import {
  PLATFORMS,
  LICENSE_PROVENANCE,
  DEFAULT_SAC_CODE,
  DEFAULT_GST_RATE,
  type Platform,
  type ProductPackage,
  type LicenseProvenance,
} from "@/types/catalog";

/**
 * Product — a ready-made software product sold as a digital licence.
 *
 * Deliberately dropped from the retail original: stock, sku, variants,
 * variantCombinations, ratings. There is no inventory (infinite supply),
 * no size/colour, and reviews are Phase 2.
 *
 * SECURITY — three fields must never reach the browser:
 *   sourceFileKey, githubRepo, provenance*
 * Public reads go through PUBLIC_PRODUCT_FIELDS (lib/product.ts) rather
 * than relying on each route to remember to omit them. `demo.adminPass`
 * IS public on purpose — it's the throwaway credential for the demo
 * admin panel, and it must never be a credential that works anywhere else.
 */

export interface IProduct {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  images: string[];
  thumbnail?: string;

  industry: mongoose.Types.ObjectId;
  techStack: mongoose.Types.ObjectId[];
  platform: Platform;

  price: number;
  discountPrice?: number;
  packages: ProductPackage[];
  sacCode: string;
  gstRate: number;

  features: string[];
  included: string[];
  demo: {
    webUrl?: string;
    adminUrl?: string;
    adminUser?: string;
    adminPass?: string;
  };
  requirements: {
    server?: string;
    language?: string;
    database?: string;
  };

  sourceFileKey?: string;
  sourceFileName?: string;
  sourceFileSize?: number;
  documentationUrl?: string;
  githubRepo?: string;

  provenance: LicenseProvenance;
  provenanceDocKey?: string;

  seo: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };

  isFeatured: boolean;
  status: "draft" | "published";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: { type: String, required: true, maxlength: 300 },
    description: { type: String, required: true },
    images: [{ type: String }],
    thumbnail: { type: String },

    industry: {
      type: Schema.Types.ObjectId,
      ref: "Industry",
      required: true,
      index: true,
    },
    techStack: [{ type: Schema.Types.ObjectId, ref: "Technology", index: true }],
    platform: { type: String, enum: PLATFORMS, required: true, index: true },

    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    packages: [
      {
        _id: false,
        id: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        platforms: [{ type: String, trim: true }],
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, min: 0 },
        features: [{ type: String, trim: true }],
        isPopular: { type: Boolean, default: false },
      },
    ],
    sacCode: { type: String, default: DEFAULT_SAC_CODE },
    gstRate: { type: Number, default: DEFAULT_GST_RATE },

    features: [{ type: String }],
    included: [{ type: String }],
    demo: {
      webUrl: { type: String },
      adminUrl: { type: String },
      adminUser: { type: String },
      // Public by design — demo-only credential, never reused elsewhere.
      adminPass: { type: String },
    },
    requirements: {
      server: { type: String },
      language: { type: String },
      database: { type: String },
    },

    /** PRIVATE bucket key. Never returned by a public endpoint. */
    sourceFileKey: { type: String },
    sourceFileName: { type: String },
    sourceFileSize: { type: Number },
    documentationUrl: { type: String },
    /** owner/repo — used for the manual collaborator invite on delivery. */
    githubRepo: { type: String },

    provenance: {
      type: String,
      enum: LICENSE_PROVENANCE,
      required: true,
      default: "in_house",
    },
    /** Upload proving right-to-resell. Enforced below for published products. */
    provenanceDocKey: { type: String },

    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      ogImage: { type: String },
    },

    isFeatured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

/**
 * Compliance gate, enforced in the schema rather than in a policy document.
 * A product you did not build in-house cannot go live without the paperwork
 * on file. If this lived only in the admin UI it would eventually be skipped.
 *
 * Written as an async hook that throws, rather than the callback style used
 * elsewhere in the base repo: Mongoose 9 removed the `next` argument from
 * pre-middleware. This form is valid in both 8 and 9, so it survives the
 * upgrade untouched.
 */
ProductSchema.pre(
  "validate",
  async function (this: mongoose.HydratedDocument<IProduct>) {
    if (
      this.status === "published" &&
      this.provenance !== "in_house" &&
      !this.provenanceDocKey
    ) {
      throw new Error(
        "Right-to-resell documentation is required before publishing a product not built in-house."
      );
    }
    if (this.status === "published" && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }
);

/** Catalogue listing: published products, newest first. */
ProductSchema.index({ status: 1, createdAt: -1 });
/** Filtered listing: industry + platform + price sort. */
ProductSchema.index({ status: 1, industry: 1, platform: 1, price: 1 });
/** Search. Weighted so a title match beats a description match. */
ProductSchema.index(
  { title: "text", shortDescription: "text", description: "text" },
  { weights: { title: 10, shortDescription: 4, description: 1 } }
);

export default models.Product || model<IProduct>("Product", ProductSchema);
