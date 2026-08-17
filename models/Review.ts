import mongoose, { Schema, models, model } from "mongoose";

export interface IReview {
  _id: string;
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  avatar?: string;
  verifiedPurchase: boolean;
  status: "published" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000, default: "" },
    avatar: { type: String, trim: true },
    verifiedPurchase: { type: Boolean, default: true },
    status: { type: String, enum: ["published", "hidden"], default: "published", index: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, status: 1, createdAt: -1 });

export default models.Review || model<IReview>("Review", ReviewSchema);
