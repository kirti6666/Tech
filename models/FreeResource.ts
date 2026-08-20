import { Schema, models, model } from "mongoose";

const ContentSectionSchema = new Schema(
  {
    heading: { type: String, default: "" },
    body: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const FreeResourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    subtitle: { type: String, default: "" },
    category: { type: String, default: "Business resources", index: true },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    galleryImages: { type: [String], default: [] },
    overview: { type: String, default: "" },
    highlights: { type: [String], default: [] },
    terms: { type: [String], default: [] },
    sections: { type: [ContentSectionSchema], default: [] },
    downloadUrl: { type: String, default: "" },
    downloadCount: { type: Number, default: 0, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  },
  { timestamps: true }
);

export default models.FreeResource || model("FreeResource", FreeResourceSchema);
