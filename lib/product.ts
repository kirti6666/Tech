import type { IProduct } from "@/models/Product";

/**
 * Single source of truth for what a non-admin is allowed to see.
 *
 * Use the projection on queries (cheaper — the private fields never leave
 * Mongo) and the strip helper as a belt-and-braces pass on anything that
 * was fetched without it. Every public route should use one or the other;
 * "I'll remember to omit it" does not survive contact with a codebase.
 */

/** Mongoose projection — exclusion form, so new private fields must be added here. */
export const PUBLIC_PRODUCT_PROJECTION =
  "-sourceFileKey -sourceFileName -sourceFileSize -githubRepo -provenance -provenanceDocKey";

const PRIVATE_KEYS = [
  "sourceFileKey",
  "sourceFileName",
  "sourceFileSize",
  "githubRepo",
  "provenance",
  "provenanceDocKey",
] as const;

export type PublicProduct = Omit<IProduct, (typeof PRIVATE_KEYS)[number]>;

export function toPublicProduct<T extends Record<string, unknown>>(
  product: T
): Omit<T, (typeof PRIVATE_KEYS)[number]> {
  const plain =
    typeof (product as { toObject?: () => Record<string, unknown> }).toObject ===
    "function"
      ? (product as unknown as { toObject: () => Record<string, unknown> }).toObject()
      : { ...product };

  for (const key of PRIVATE_KEYS) delete plain[key];
  return plain as Omit<T, (typeof PRIVATE_KEYS)[number]>;
}

export function toPublicProducts<T extends Record<string, unknown>>(products: T[]) {
  return products.map(toPublicProduct);
}

/** Price actually charged, after any discount. Use everywhere — never recompute inline. */
export function effectivePrice(product: Pick<IProduct, "price" | "discountPrice">) {
  return product.discountPrice && product.discountPrice > 0
    ? product.discountPrice
    : product.price;
}
