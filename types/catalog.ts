/**
 * Shared catalogue vocabulary.
 *
 * These live outside the models so the admin forms, filter UI and API
 * validation all read from one place. If you add a platform here, the
 * schema enum, the filter checkboxes and the Zod validators all pick it
 * up — there is no second list to keep in sync.
 */

export const PLATFORMS = ["web", "android", "ios", "web_app"] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface ProductPackage {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  price: number;
  originalPrice?: number;
  features: string[];
  isPopular?: boolean;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  web: "Web",
  android: "Android",
  ios: "iOS",
  web_app: "Web + App",
};

/** Groups the technology tags in admin UI and on the tech landing pages. */
export const TECH_CATEGORIES = [
  "frontend",
  "backend",
  "mobile",
  "database",
  "other",
] as const;
export type TechCategory = (typeof TECH_CATEGORIES)[number];

export const TECH_CATEGORY_LABELS: Record<TechCategory, string> = {
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  database: "Database",
  other: "Other",
};

export const ADDON_TYPES = ["rebranding", "deployment", "maintenance"] as const;
export type AddonType = (typeof ADDON_TYPES)[number];

/**
 * Where a product came from. Required before publishing — see the
 * compliance note in the build plan. This is never exposed publicly;
 * it exists so you can prove right-to-resell if anyone asks.
 */
export const LICENSE_PROVENANCE = ["in_house", "reseller", "licensed"] as const;
export type LicenseProvenance = (typeof LICENSE_PROVENANCE)[number];

export const ORDER_STATUSES = [
  "pending",
  "completed",
  "refunded",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SERVICE_STATUSES = [
  "pending",
  "in_progress",
  "delivered",
] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

/** Default SAC for electronically supplied software licences. Confirm with your CA. */
export const DEFAULT_SAC_CODE = "997331";
export const DEFAULT_GST_RATE = 18;

/** Catalogue sorting shared by server queries and client-side controls. */
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
