import { Schema, models, model } from "mongoose";

/**
 * SiteSettings — a SINGLETON document that holds every piece of site-wide,
 * admin-editable content/config for the storefront. There is only ever ONE
 * of these (identified by `singletonKey: "site"`), so the whole CMS is just
 * "read this one doc, edit this one doc".
 *
 * Design choices:
 *  - Grouped into logical sections (brand, seo, theme, commerce, home, ...)
 *    so the admin form can render one tab per section.
 *  - Sub-documents use `_id: false` — these are plain config blobs, not
 *    separately-addressable records, so they don't need their own ids.
 *  - Nothing here is "required": getSiteSettings() always merges the stored
 *    doc over DEFAULT_SETTINGS, so a missing field can never break a page.
 */

// ---- Sub-schemas (repeatable list items) -------------------------------

const LinkSchema = new Schema(
  {
    label: { type: String, default: "" },
    href: { type: String, default: "" },
  },
  { _id: false }
);

const FooterColumnSchema = new Schema(
  {
    title: { type: String, default: "" },
    links: { type: [LinkSchema], default: [] },
  },
  { _id: false }
);

const HighlightSchema = new Schema(
  {
    icon: { type: String, default: "" }, // lucide icon name, e.g. "Truck"
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
  },
  { _id: false }
);

const BannerSchema = new Schema(
  {
    image: { type: String, default: "" },
    heading: { type: String, default: "" },
    subheading: { type: String, default: "" },
    link: { type: String, default: "" },
  },
  { _id: false }
);

// ---- Section sub-schemas -----------------------------------------------

const BrandSchema = new Schema(
  {
    storeName: { type: String, default: "TechBro" },
    tagline: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
  },
  { _id: false }
);

const SeoSchema = new Schema(
  {
    metaTitle: { type: String, default: "Ready-made websites, apps and software | TechBro" },
    metaDescription: { type: String, default: "" },
  },
  { _id: false }
);

const ThemeSchema = new Schema(
  {
    primaryColor: { type: String, default: "#111827" },
    primaryForeground: { type: String, default: "#ffffff" },
  },
  { _id: false }
);

const CommerceSchema = new Schema(
  {
    currencySymbol: { type: String, default: "₹" },
    currencyCode: { type: String, default: "INR" },
    shippingFee: { type: Number, default: 49 },
    freeShippingThreshold: { type: Number, default: 999 },
    codEnabled: { type: Boolean, default: true },
    razorpayEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const AnnouncementSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    text: { type: String, default: "" },
    link: { type: String, default: "" },
  },
  { _id: false }
);

const HeroSchema = new Schema(
  {
    title: { type: String, default: "Build and launch with TechBro" },
    subtitle: { type: String, default: "Quality products, fair prices, fast shipping." },
    ctaText: { type: String, default: "Shop Now" },
    ctaLink: { type: String, default: "/shop" },
    backgroundImage: { type: String, default: "" },
  },
  { _id: false }
);

const HomeSchema = new Schema(
  {
    hero: { type: HeroSchema, default: () => ({}) },
    categoriesHeading: { type: String, default: "Shop by Category" },
    featuredHeading: { type: String, default: "Featured Products" },
    highlights: { type: [HighlightSchema], default: [] },
    banners: { type: [BannerSchema], default: [] },
  },
  { _id: false }
);

const HeaderSchema = new Schema(
  {
    navLinks: { type: [LinkSchema], default: [] },
  },
  { _id: false }
);

const FooterSchema = new Schema(
  {
    about: { type: String, default: "" },
    columns: { type: [FooterColumnSchema], default: [] },
    copyrightText: { type: String, default: "" },
  },
  { _id: false }
);

const ContactSchema = new Schema(
  {
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { _id: false }
);

const SocialSchema = new Schema(
  {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" },
  },
  { _id: false }
);

// ---- Root schema --------------------------------------------------------

const SiteSettingsSchema = new Schema(
  {
    // Guarantees a single row; PUT upserts against this key.
    singletonKey: { type: String, default: "site", unique: true, index: true },

    brand: { type: BrandSchema, default: () => ({}) },
    seo: { type: SeoSchema, default: () => ({}) },
    theme: { type: ThemeSchema, default: () => ({}) },
    commerce: { type: CommerceSchema, default: () => ({}) },
    announcement: { type: AnnouncementSchema, default: () => ({}) },
    home: { type: HomeSchema, default: () => ({}) },
    header: { type: HeaderSchema, default: () => ({}) },
    footer: { type: FooterSchema, default: () => ({}) },
    contact: { type: ContactSchema, default: () => ({}) },
    social: { type: SocialSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default models.SiteSettings || model("SiteSettings", SiteSettingsSchema);
