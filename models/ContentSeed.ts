import { Schema, models, model } from "mongoose";

const ContentSeedSchema = new Schema(
  { key: { type: String, required: true, unique: true, index: true } },
  { timestamps: true }
);

export default models.ContentSeed || model("ContentSeed", ContentSeedSchema);
