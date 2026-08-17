import mongoose, { Schema, models, model } from "mongoose";

export interface ITestimonial {
  _id: string;
  scope: "home" | "product";
  product?: mongoose.Types.ObjectId;
  name: string;
  avatar?: string;
  role?: string;
  rating: number;
  comment: string;
  status: "published" | "hidden";
  displayOrder: number;
  isSample: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    scope: { type: String, enum: ["home", "product"], required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    avatar: { type: String, trim: true },
    role: { type: String, trim: true, maxlength: 140 },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["published", "hidden"], default: "published", index: true },
    displayOrder: { type: Number, default: 0 },
    // Sample testimonials must never be mixed into verified-buyer ratings.
    isSample: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TestimonialSchema.index({ scope: 1, product: 1, status: 1, displayOrder: 1 });

export default models.Testimonial || model<ITestimonial>("Testimonial", TestimonialSchema);
