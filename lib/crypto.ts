import crypto from "crypto";

/**
 * Authenticated field encryption for the small number of values that are
 * genuinely secret at rest — hosting passwords and SSH keys that customers
 * hand over for a deployment.
 *
 * AES-256-GCM, so tampering is detected rather than silently decrypting to
 * garbage. Format is `v1:<iv>:<tag>:<ciphertext>`, all base64url. The version
 * prefix is there so a future key rotation can decrypt old values while
 * writing new ones.
 *
 * Scope, stated plainly: this protects against a leaked database dump and
 * against an admin screen accidentally rendering a password into a page. It
 * does not protect against someone who has both the database and
 * CREDENTIALS_ENCRYPTION_KEY. Keep the key out of the database backup, and
 * rotate it if it ever appears in a log.
 *
 * The real mitigation is not storing these for long at all — see
 * lib/services/purgeCredentials.ts. Encryption is what covers the window
 * where you legitimately need them.
 */

const ALGORITHM = "aes-256-gcm";
const PREFIX = "v1";

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32"
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY must decode to exactly 32 bytes (base64 of 32 random bytes)."
    );
  }
  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptSecret(value: string): string {
  const [version, ivPart, tagPart, dataPart] = value.split(":");
  if (version !== PREFIX || !ivPart || !tagPart || !dataPart) {
    throw new Error("Malformed encrypted value");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(`${PREFIX}:`);
}
