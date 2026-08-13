import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

async function ensureAdmin() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";

  if (!uri || !email || password.length < 8) {
    throw new Error(
      "MONGODB_URI, SEED_ADMIN_EMAIL and a password of at least 8 characters are required."
    );
  }

  await mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 8000,
  });

  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await mongoose.connection.db!.collection("users").updateOne(
    { email },
    {
      $set: {
        name: "TechBro Admin",
        email,
        password: passwordHash,
        role: "admin",
        provider: "credentials",
        isVerified: true,
        updatedAt: now,
      },
      $setOnInsert: {
        addresses: [],
        wishlist: [],
        createdAt: now,
      },
    },
    { upsert: true }
  );

  console.log(
    result.upsertedCount === 1
      ? "Admin account created."
      : "Admin account credentials updated."
  );
  await mongoose.disconnect();
}

ensureAdmin().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Unable to create admin.");
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
