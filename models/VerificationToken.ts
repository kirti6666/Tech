import mongoose, { Schema, models, model } from "mongoose";
import crypto from "crypto";

/**
 * Email verification tokens.
 *
 * The token is stored HASHED, never in plaintext. The raw value goes in the
 * verification link and nowhere else — so a leaked database dump doesn't
 * hand someone the ability to verify arbitrary accounts. Same reasoning as
 * password hashing, and it costs one line.
 *
 * A TTL index expires documents automatically 24 hours after creation, so
 * there is no cleanup job to remember and no slowly growing table of dead
 * tokens.
 */

export interface IVerificationToken {
  _id: string;
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  /** Snapshot of the address at issue time — an email change invalidates it. */
  email: { type: String, required: true, lowercase: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// MongoDB removes expired documents automatically.
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateVerificationToken(): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = crypto.randomBytes(32).toString("base64url");
  return {
    raw,
    hash: hashToken(raw),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

export default models.VerificationToken ||
  model<IVerificationToken>("VerificationToken", VerificationTokenSchema);
