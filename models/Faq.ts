import { Schema, models, model } from "mongoose";

const FaqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, default: "General", index: true },
    categoryDescription: { type: String, default: "" },
    linkLabel: { type: String, default: "" },
    linkHref: { type: String, default: "" },
    displayOrder: { type: Number, default: 0, index: true },
    status: { type: String, enum: ["published", "hidden"], default: "published", index: true },
  },
  { timestamps: true }
);

export default models.Faq || model("Faq", FaqSchema);
