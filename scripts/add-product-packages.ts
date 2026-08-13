import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import Product from "../models/Product";

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ $or: [{ packages: { $exists: false } }, { packages: { $size: 0 } }] });
  for (const product of products) {
    const base = product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;
    const benefits = ["Complete source code", "Installation guide", "30 days of installation support"];
    product.packages = [
      { id: "web", name: "Web package", description: "Complete responsive website solution", platforms: ["Web"], price: base, originalPrice: product.price > base ? product.price : Math.round(base * 1.2), features: benefits },
      { id: "web-android-ios", name: "Web + Android + iOS", description: "Website and mobile applications", platforms: ["Web", "Android", "iOS"], price: Math.round(base * 1.35), originalPrice: Math.round(product.price * 1.55), features: [...benefits, "Android and iOS applications"], isPopular: true },
      { id: "complete-ai", name: "Web + Android + iOS + AI", description: "Complete multi-platform solution with AI", platforms: ["Web", "Android", "iOS", "AI"], price: Math.round(base * 1.7), originalPrice: Math.round(product.price * 2), features: [...benefits, "Android and iOS applications", "AI-powered workflows"] },
    ];
    await product.save();
  }
  console.log(`Added packages to ${products.length} products.`);
  await mongoose.disconnect();
}

run().catch((error) => { console.error(error); process.exit(1); });
