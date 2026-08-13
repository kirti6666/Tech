import crypto from "crypto";
import License from "@/models/License";

/**
 * Licence key generation: TB-XXXX-XXXX-XXXX
 *
 * Alphabet is Crockford base32 minus the ambiguous characters (I, L, O,
 * U and the digits 0 and 1). Customers read these keys out over the
 * phone and paste them into support tickets; "0 or O?" is a support cost
 * you pay forever if you use a full alphabet here.
 *
 * 12 characters over a 26-symbol alphabet is ~56 bits — not guessable,
 * but the key is an identifier, NOT an authorisation token. Downloads
 * are authorised by session ownership of the licence, never by
 * possession of the key. Treat a leaked key as embarrassing, not fatal.
 */

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const GROUPS = 3;
const GROUP_LEN = 4;

function randomBlock(length: number): string {
  const out: string[] = [];
  // Rejection sampling — modulo on raw bytes would bias the early symbols.
  const max = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  while (out.length < length) {
    const bytes = crypto.randomBytes(length * 2);
    for (const byte of bytes) {
      if (byte >= max) continue;
      out.push(ALPHABET[byte % ALPHABET.length]);
      if (out.length === length) break;
    }
  }
  return out.join("");
}

export function generateLicenseKey(): string {
  const groups = Array.from({ length: GROUPS }, () => randomBlock(GROUP_LEN));
  return `TB-${groups.join("-")}`;
}

/**
 * Generates a key that is not already in the database.
 *
 * The unique index on License.key is the real guarantee — this loop just
 * avoids surfacing a duplicate-key error on the astronomically unlikely
 * collision. Keep the insert's own error handling; do not rely on this
 * check alone, since another request can insert between check and write.
 */
export async function generateUniqueLicenseKey(maxAttempts = 5): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = generateLicenseKey();
    const exists = await License.exists({ key });
    if (!exists) return key;
  }
  throw new Error("Could not generate a unique licence key after several attempts");
}

/** Accepts user input in any case, with or without dashes. */
export function normaliseLicenseKey(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = cleaned.startsWith("TB") ? cleaned.slice(2) : cleaned;
  if (body.length !== GROUPS * GROUP_LEN) return input.toUpperCase().trim();
  const groups = body.match(/.{1,4}/g) ?? [];
  return `TB-${groups.join("-")}`;
}
