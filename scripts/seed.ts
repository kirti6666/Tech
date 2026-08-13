/**
 * Seed script — TechBro catalogue.
 *
 * Populates: 1 admin user, 10 industries, 22 technology tags, 10 sample
 * products, 2 coupons.
 *
 * Run with: npm run seed
 * Requires MONGODB_URI in .env.local
 *
 * WARNING: clears Industry / Technology / Product / Coupon and the admin
 * user before reseeding. Local and staging only — never point this at a
 * database that has taken a real payment. Orders and licences are left
 * untouched precisely so that an accidental run cannot destroy delivery
 * records, but the products those orders reference will be recreated
 * with new _ids, which will orphan them. Treat a prod run as a mistake.
 *
 * Product names here follow the compliance rule: descriptive, generic,
 * never "<SomeCompany> Clone".
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Industry, Technology, Product, Coupon } from "../models";
import { recountTaxonomy } from "../lib/recountTaxonomy";
import type { TechCategory } from "../types/catalog";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Add it to .env.local before seeding.");
  process.exit(1);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const INDUSTRIES: { name: string; icon: string; description: string }[] = [
  { name: "Fintech", icon: "banknote", description: "Payments, lending, wallets and financial dashboards." },
  { name: "EdTech", icon: "graduation-cap", description: "Learning platforms, school and coaching management." },
  { name: "Healthcare", icon: "heart-pulse", description: "Clinic, hospital and telemedicine platforms." },
  { name: "E-commerce", icon: "shopping-cart", description: "Storefronts, marketplaces and order management." },
  { name: "Real Estate", icon: "building-2", description: "Property listings, brokerage and rental management." },
  { name: "Logistics", icon: "truck", description: "Fleet, courier and delivery tracking systems." },
  { name: "Food & Restaurant", icon: "utensils", description: "Ordering, POS and restaurant management." },
  { name: "HR & Recruitment", icon: "users", description: "Hiring, payroll and workforce management." },
  { name: "Travel", icon: "plane", description: "Booking engines and travel agency platforms." },
  { name: "SaaS & Productivity", icon: "layout-dashboard", description: "Multi-tenant tools and internal platforms." },
];

const TECHNOLOGIES: { name: string; category: TechCategory }[] = [
  { name: "React", category: "frontend" },
  { name: "Next.js", category: "frontend" },
  { name: "Vue", category: "frontend" },
  { name: "Angular", category: "frontend" },
  { name: "Node.js", category: "backend" },
  { name: "Laravel", category: "backend" },
  { name: "Django", category: "backend" },
  { name: "PHP", category: "backend" },
  { name: ".NET", category: "backend" },
  { name: "Flutter", category: "mobile" },
  { name: "React Native", category: "mobile" },
  { name: "Kotlin", category: "mobile" },
  { name: "Swift", category: "mobile" },
  { name: "MongoDB", category: "database" },
  { name: "MySQL", category: "database" },
  { name: "PostgreSQL", category: "database" },
  { name: "Firebase", category: "database" },
  { name: "WordPress", category: "other" },
  { name: "AI/ML", category: "other" },
  { name: "Blockchain", category: "other" },
  { name: "Redis", category: "other" },
  { name: "Docker", category: "other" },
];

type SeedProduct = {
  title: string;
  industry: string;
  tech: string[];
  platform: "web" | "android" | "ios" | "web_app";
  price: number;
  discountPrice?: number;
  shortDescription: string;
  features: string[];
  requirements: { server: string; language: string; database: string };
};

const PRODUCTS: SeedProduct[] = [
  {
    title: "Online Course Platform",
    industry: "EdTech",
    tech: ["Next.js", "Node.js", "MongoDB"],
    platform: "web_app",
    price: 74999,
    discountPrice: 59999,
    shortDescription:
      "Multi-instructor course marketplace with video hosting, quizzes, certificates and revenue sharing.",
    features: [
      "Instructor onboarding and payouts",
      "Video lessons with progress tracking",
      "Quizzes and auto-generated certificates",
      "Coupons and bundled course pricing",
      "Student dashboard with resume-where-you-left-off",
    ],
    requirements: { server: "2 vCPU, 4GB RAM", language: "Node.js 20+", database: "MongoDB 6+" },
  },
  {
    title: "Clinic & Appointment Management System",
    industry: "Healthcare",
    tech: ["Laravel", "MySQL", "Flutter"],
    platform: "web_app",
    price: 89999,
    shortDescription:
      "Doctor scheduling, patient records, prescriptions and billing with a patient-facing mobile app.",
    features: [
      "Multi-doctor appointment scheduling",
      "Digital prescriptions and case history",
      "Patient mobile app for booking",
      "Billing with GST-ready invoices",
      "SMS and WhatsApp appointment reminders",
    ],
    requirements: { server: "2 vCPU, 4GB RAM", language: "PHP 8.2+", database: "MySQL 8+" },
  },
  {
    title: "Food Ordering & Delivery Platform",
    industry: "Food & Restaurant",
    tech: ["React", "Node.js", "MongoDB", "Flutter"],
    platform: "web_app",
    price: 119999,
    discountPrice: 99999,
    shortDescription:
      "Customer app, restaurant panel and delivery-partner app with live order tracking.",
    features: [
      "Three apps: customer, restaurant, delivery partner",
      "Live order tracking on map",
      "Menu, variants and add-on management",
      "Commission and payout settlement",
      "Razorpay and cash-on-delivery",
    ],
    requirements: { server: "4 vCPU, 8GB RAM", language: "Node.js 20+", database: "MongoDB 6+" },
  },
  {
    title: "Property Listing & Brokerage Portal",
    industry: "Real Estate",
    tech: ["Next.js", "PostgreSQL", "Node.js"],
    platform: "web",
    price: 64999,
    shortDescription:
      "Property search with map view, agent profiles, enquiry routing and featured listing monetisation.",
    features: [
      "Map-based property search with filters",
      "Agent and builder profiles",
      "Paid featured listings",
      "Enquiry routing and lead dashboard",
      "SEO-ready listing pages",
    ],
    requirements: { server: "2 vCPU, 4GB RAM", language: "Node.js 20+", database: "PostgreSQL 15+" },
  },
  {
    title: "Multi-Vendor E-commerce Marketplace",
    industry: "E-commerce",
    tech: ["Next.js", "Node.js", "MongoDB", "Redis"],
    platform: "web_app",
    price: 139999,
    shortDescription:
      "Seller onboarding, per-vendor storefronts, commission handling and unified checkout.",
    features: [
      "Vendor registration and KYC upload",
      "Per-vendor product and order dashboards",
      "Commission rules and payout reports",
      "Unified cart across vendors",
      "GST invoicing per seller",
    ],
    requirements: { server: "4 vCPU, 8GB RAM", language: "Node.js 20+", database: "MongoDB 6+" },
  },
  {
    title: "Digital Lending & Loan Management System",
    industry: "Fintech",
    tech: ["Django", "PostgreSQL", "React"],
    platform: "web",
    price: 149999,
    shortDescription:
      "Loan origination, EMI scheduling, collections and borrower portal with audit trails.",
    features: [
      "Configurable loan products and interest rules",
      "EMI schedule generation and part-payment",
      "Collections queue with follow-up log",
      "Borrower self-service portal",
      "Immutable audit trail on every transaction",
    ],
    requirements: { server: "4 vCPU, 8GB RAM", language: "Python 3.11+", database: "PostgreSQL 15+" },
  },
  {
    title: "Fleet & Delivery Tracking System",
    industry: "Logistics",
    tech: ["Node.js", "React", "MongoDB", "React Native"],
    platform: "web_app",
    price: 94999,
    shortDescription:
      "Vehicle tracking, trip assignment, proof of delivery and driver mobile app.",
    features: [
      "Live vehicle location on map",
      "Trip assignment and route history",
      "Proof of delivery with photo and signature",
      "Driver mobile app",
      "Fuel and maintenance logs",
    ],
    requirements: { server: "2 vCPU, 4GB RAM", language: "Node.js 20+", database: "MongoDB 6+" },
  },
  {
    title: "HR & Payroll Management System",
    industry: "HR & Recruitment",
    tech: ["Laravel", "MySQL", "Vue"],
    platform: "web",
    price: 69999,
    shortDescription:
      "Attendance, leave, payroll with Indian statutory compliance and employee self-service.",
    features: [
      "Attendance with geo-tagged check-in",
      "Leave policies and approval workflow",
      "Payroll with PF, ESI and TDS",
      "Payslip generation and email",
      "Employee self-service portal",
    ],
    requirements: { server: "2 vCPU, 4GB RAM", language: "PHP 8.2+", database: "MySQL 8+" },
  },
  {
    title: "Travel Booking Engine",
    industry: "Travel",
    tech: ["Next.js", "Node.js", "PostgreSQL"],
    platform: "web",
    price: 109999,
    shortDescription:
      "Package and hotel booking with itinerary builder, agent panel and payment collection.",
    features: [
      "Package builder with day-wise itinerary",
      "Hotel and room inventory",
      "Agent panel with markup control",
      "Part-payment and instalment collection",
      "Auto-generated travel vouchers",
    ],
    requirements: { server: "2 vCPU, 4GB RAM", language: "Node.js 20+", database: "PostgreSQL 15+" },
  },
  {
    title: "Multi-Tenant SaaS Starter Kit",
    industry: "SaaS & Productivity",
    tech: ["Next.js", "Node.js", "PostgreSQL", "Docker"],
    platform: "web",
    price: 84999,
    discountPrice: 69999,
    shortDescription:
      "Workspace isolation, team roles, subscription billing and admin console — a base to build on.",
    features: [
      "Tenant isolation with per-workspace data",
      "Team invitations and granular roles",
      "Subscription billing with plan limits",
      "Super-admin console across tenants",
      "Docker setup for one-command deploy",
    ],
    requirements: { server: "2 vCPU, 4GB RAM", language: "Node.js 20+", database: "PostgreSQL 15+" },
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  await Promise.all([
    Industry.deleteMany({}),
    Technology.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    User.deleteMany({ role: "admin" }),
  ]);
  console.log("Cleared catalogue collections.");

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is not set. Set a strong value in .env.local — this script will not create an admin with a default password."
    );
  }
  await User.create({
    name: "TechBro Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@techbro.in",
    password: await bcrypt.hash(adminPassword, 12),
    role: "admin",
    provider: "credentials",
    isVerified: true,
  });
  console.log("Created admin user.");

  const industries = await Industry.insertMany(
    INDUSTRIES.map((industry, index) => ({
      ...industry,
      slug: slugify(industry.name),
      displayOrder: index,
    }))
  );
  const industryBySlug = new Map(industries.map((i) => [i.slug, i]));

  const technologies = await Technology.insertMany(
    TECHNOLOGIES.map((tech, index) => ({
      ...tech,
      slug: slugify(tech.name),
      displayOrder: index,
    }))
  );
  const techBySlug = new Map(technologies.map((t) => [t.slug, t]));
  console.log(
    `Created ${industries.length} industries and ${technologies.length} technologies.`
  );

  await Product.insertMany(
    PRODUCTS.map((product, index) => {
      const industry = industryBySlug.get(slugify(product.industry));
      if (!industry) throw new Error(`Unknown industry: ${product.industry}`);

      const techIds = product.tech.map((name) => {
        const tech = techBySlug.get(slugify(name));
        if (!tech) throw new Error(`Unknown technology: ${name}`);
        return tech._id;
      });

      return {
        title: product.title,
        slug: slugify(product.title),
        shortDescription: product.shortDescription,
        description: `${product.shortDescription}\n\nDelivered with complete source code, database schema, installation guide and technical documentation. Rebranding and deployment are available as add-ons at checkout.`,
        images: [],
        industry: industry._id,
        techStack: techIds,
        platform: product.platform,
        price: product.price,
        discountPrice: product.discountPrice,
        packages: (() => {
          const base = product.discountPrice ?? product.price;
          const benefits = ["Complete source code", "Installation guide", "30 days of installation support"];
          return [
            { id: "web", name: "Web package", description: "Complete responsive website solution", platforms: ["Web"], price: base, originalPrice: product.price > base ? product.price : Math.round(base * 1.2), features: benefits },
            { id: "web-android-ios", name: "Web + Android + iOS", description: "Website and mobile applications", platforms: ["Web", "Android", "iOS"], price: Math.round(base * 1.35), originalPrice: Math.round(product.price * 1.55), features: [...benefits, "Android and iOS applications"], isPopular: true },
            { id: "complete-ai", name: "Web + Android + iOS + AI", description: "Complete multi-platform solution with AI", platforms: ["Web", "Android", "iOS", "AI"], price: Math.round(base * 1.7), originalPrice: Math.round(product.price * 2), features: [...benefits, "Android and iOS applications", "AI-powered workflows"] },
          ];
        })(),
        features: product.features,
        included: [
          "Complete source code",
          "Database schema and sample data",
          "Installation guide",
          "Technical documentation",
          "30 days of installation support",
        ],
        requirements: product.requirements,
        demo: {},
        provenance: "in_house",
        seo: {
          metaTitle: `${product.title} — Ready-Made Source Code | TechBro`,
          metaDescription: product.shortDescription.slice(0, 155),
        },
        isFeatured: index < 4,
        status: "published",
        publishedAt: new Date(),
      };
    })
  );
  console.log(`Created ${PRODUCTS.length} products.`);

  await Coupon.insertMany([
    {
      code: "LAUNCH10",
      discountType: "percent",
      value: 10,
      minOrderValue: 0,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 200,
      isActive: true,
    },
    {
      code: "FLAT5000",
      discountType: "flat",
      value: 5000,
      minOrderValue: 50000,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 50,
      isActive: true,
    },
  ]);

  await recountTaxonomy();
  console.log("Recounted taxonomy.");

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
