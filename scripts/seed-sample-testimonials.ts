import "dotenv/config";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product";
import Testimonial from "../models/Testimonial";

dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required.");

const homeSamples = [
  { name: "Aarav Mehta", role: "Operations Lead · Sample profile", rating: 5, comment: "The product catalogue made it easier to compare a ready-made starting point with a full custom build." },
  { name: "Nisha Rao", role: "Business Owner · Sample profile", rating: 5, comment: "Clear package details and source-code ownership gave us a much better picture of the total project scope." },
  { name: "Kabir Shah", role: "Product Manager · Sample profile", rating: 4, comment: "The live demo and launch plan helped us identify what was ready and what needed customisation before purchase." },
];

const productSamples = [
  { name: "Asha Mehta", role: "Product Lead · Sample profile", rating: 5, comment: "The interface covered the core workflow clearly and gave our team a practical base for customisation." },
  { name: "Rohan Kapoor", role: "Operations Manager · Sample profile", rating: 5, comment: "The dashboard structure brought the main daily tasks into one place and made the process easier to understand." },
  { name: "Neha Verma", role: "Founder · Sample profile", rating: 4, comment: "The live preview and documented feature scope made it simple to decide which package would be the right starting point." },
];

async function main() {
  await mongoose.connect(uri!);

  for (const [displayOrder, item] of homeSamples.entries()) {
    await Testimonial.updateOne(
      { scope: "home", name: item.name, isSample: true },
      { $setOnInsert: { ...item, scope: "home", status: "published", displayOrder, isSample: true } },
      { upsert: true }
    );
  }

  const products = await Product.find({}).select("_id title").lean();
  for (const product of products) {
    for (const [displayOrder, item] of productSamples.entries()) {
      await Testimonial.updateOne(
        { scope: "product", product: product._id, name: item.name, isSample: true },
        { $setOnInsert: { ...item, scope: "product", product: product._id, status: "published", displayOrder, isSample: true } },
        { upsert: true }
      );
    }
  }

  console.log(`Sample testimonials ready: 3 homepage and 3 each for ${products.length} products.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
