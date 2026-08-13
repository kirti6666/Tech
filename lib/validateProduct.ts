import { PLATFORMS, LICENSE_PROVENANCE } from "@/types/catalog";
import type { ProductPackage } from "@/types/catalog";

/**
 * Product validation, shared by the create and update routes.
 *
 * Lives here rather than in the route file because Next.js only permits
 * HTTP method handlers and a fixed set of config values as exports from a
 * route module — exporting a helper from one is a build error. The `[id]`
 * route needs the same rules for PATCH that POST uses, so the shared code
 * has to live outside both.
 *
 * `partial` mode skips required-field checks so a PATCH can update a single
 * field without resending the whole product.
 */

export interface ProductInput {
  slug?: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  images?: string[];
  thumbnail?: string;
  industry?: string;
  techStack?: string[];
  platform?: string;
  price?: number;
  discountPrice?: number;
  packages?: ProductPackage[];
  sacCode?: string;
  gstRate?: number;
  features?: string[];
  included?: string[];
  demo?: Record<string, string>;
  requirements?: Record<string, string>;
  documentationUrl?: string;
  githubRepo?: string;
  provenance?: string;
  provenanceDocKey?: string;
  seo?: Record<string, string>;
  isFeatured?: boolean;
  status?: "draft" | "published";
}

/** Shared by create and update so both reject the same bad input. */
export function validateProduct(
  input: ProductInput,
  { partial }: { partial: boolean }
): Record<string, string> {
  const errors: Record<string, string> = {};
  const has = (key: keyof ProductInput) => input[key] !== undefined;

  if (!partial || has("title")) {
    if (!input.title?.trim()) errors.title = "A title is required";
  }
  if (has("slug") && input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens only";
  }
  if (!partial || has("shortDescription")) {
    if (!input.shortDescription?.trim()) {
      errors.shortDescription = "A one-line summary is required";
    } else if (input.shortDescription.length > 300) {
      errors.shortDescription = "Keep this under 300 characters";
    }
  }
  if (!partial || has("industry")) {
    if (!input.industry) errors.industry = "Choose an industry";
  }
  if (!partial || has("platform")) {
    if (!input.platform || !(PLATFORMS as readonly string[]).includes(input.platform)) {
      errors.platform = "Choose a platform";
    }
  }
  if (!partial || has("price")) {
    if (typeof input.price !== "number" || input.price < 0) {
      errors.price = "Enter a price";
    }
  }
  if (has("discountPrice") && input.discountPrice) {
    const price = input.price ?? 0;
    if (price && input.discountPrice >= price) {
      errors.discountPrice = "The offer price must be lower than the list price";
    }
  }
  if (has("packages")) {
    if (!Array.isArray(input.packages)) {
      errors.packages = "Packages must be a list";
    } else {
      const ids = new Set<string>();
      for (const [index, item] of input.packages.entries()) {
        if (!item.id?.trim() || !item.name?.trim()) {
          errors.packages = `Package ${index + 1} needs an id and name`;
          break;
        }
        if (ids.has(item.id)) {
          errors.packages = "Each package must have a unique id";
          break;
        }
        ids.add(item.id);
        if (typeof item.price !== "number" || item.price < 0) {
          errors.packages = `Package ${index + 1} needs a valid price`;
          break;
        }
        if (item.originalPrice && item.originalPrice < item.price) {
          errors.packages = `Package ${index + 1} list price must be at least its sale price`;
          break;
        }
      }
    }
  }
  if (has("gstRate") && (typeof input.gstRate !== "number" || input.gstRate < 0 || input.gstRate > 100)) {
    errors.gstRate = "Enter a GST rate between 0 and 100";
  }
  if (has("provenance") && input.provenance) {
    if (!(LICENSE_PROVENANCE as readonly string[]).includes(input.provenance)) {
      errors.provenance = "Unknown provenance value";
    }
  }
  if (has("githubRepo") && input.githubRepo) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(input.githubRepo.trim())) {
      errors.githubRepo = "Use the owner/repo form, e.g. geoloide/clinic-system";
    }
  }

  return errors;
}
