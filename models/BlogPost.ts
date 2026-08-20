import { Schema, models, model } from "mongoose";

const BlogSectionSchema = new Schema(
  {
    heading: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: "" },
    category: { type: String, default: "Business growth", index: true },
    coverImage: { type: String, default: "" },
    author: { type: String, default: "TechBro Editorial" },
    authorRole: { type: String, default: "TechBro team" },
    intro: { type: String, default: "" },
    sections: { type: [BlogSectionSchema], default: [] },
    readTime: { type: Number, default: 5, min: 1, max: 120 },
    publishedAt: { type: Date, default: Date.now, index: true },
    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  },
  { timestamps: true }
);

export default models.BlogPost || model("BlogPost", BlogPostSchema);
