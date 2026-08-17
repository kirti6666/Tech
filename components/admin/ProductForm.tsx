"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORMS, PLATFORM_LABELS, TECH_CATEGORY_LABELS } from "@/types/catalog";
import type { Platform, TechCategory, LicenseProvenance, ProductPackage } from "@/types/catalog";
import { ProductActions } from "@/components/admin/ProductActions";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SingleVideoUpload } from "@/components/admin/SingleVideoUpload";
import { adminFetch } from "@/lib/adminFetch";

interface Option {
  _id: string;
  name: string;
  slug: string;
}
interface TechOption extends Option {
  category: TechCategory;
}

export interface ProductDraft {
  _id?: string;
  slug?: string;
  title: string;
  shortDescription: string;
  description: string;
  images: string[];
  thumbnail: string;
  industry: string;
  techStack: string[];
  platform: Platform | "";
  price: number | "";
  discountPrice: number | "";
  packages: ProductPackage[];
  sacCode: string;
  gstRate: number | "";
  features: string[];
  included: string[];
  demo: {
    webUrl: string;
    adminUrl: string;
    adminUser: string;
    adminPass: string;
    appStoreUrl: string;
    playStoreUrl: string;
    workflowVideoUrl: string;
  };
  requirements: { server: string; language: string; database: string };
  documentationUrl: string;
  githubRepo: string;
  provenance: LicenseProvenance;
  provenanceDocKey: string;
  seo: { metaTitle: string; metaDescription: string; ogImage: string };
  isFeatured: boolean;
  status: "draft" | "published";
}

/**
 * The product editor.
 *
 * Grouped so the sequence matches how a product actually gets listed:
 * describe it, classify it, price it, prove you can sell it, then publish.
 * Publishing sits last and on its own because it's the
 * only irreversible-feeling action on the page.
 *
 * Everything is one form with one save. A multi-step wizard would be tidier
 * to look at and much worse to use on the fifth product, when you know
 * exactly which two fields you came to change.
 */
export function ProductForm({
  initial,
  industries,
  technologies,
  licenseCount = 0,
}: {
  initial: ProductDraft;
  industries: Option[];
  technologies: TechOption[];
  licenseCount?: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const initialTechNames = Object.fromEntries(
    (Object.keys(TECH_CATEGORY_LABELS) as TechCategory[]).map((category) => [
      category,
      technologies.filter((tech) => tech.category === category && initial.techStack.includes(tech._id)).map((tech) => tech.name).join(", "),
    ])
  ) as Record<TechCategory, string>;
  const [techNames, setTechNames] = useState<Record<TechCategory, string>>(initialTechNames);

  const isNew = !draft._id;

  function set<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft({ ...draft, [key]: value });
    setSaved(false);
  }

  async function save(nextStatus?: "draft" | "published") {
    setBusy(true);
    setErrors({});
    setFormError(null);

    let resolvedTechStack: string[] = [];
    try {
      for (const category of Object.keys(TECH_CATEGORY_LABELS) as TechCategory[]) {
        const names = techNames[category].split(",").map((name) => name.trim()).filter(Boolean);
        for (const name of names) {
          const existing = technologies.find((tech) => tech.category === category && tech.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            resolvedTechStack.push(existing._id);
            continue;
          }
          const created = await adminFetch("/api/admin/taxonomy?kind=technology", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category }) });
          const createdData = await created.json();
          if (!created.ok) throw new Error(createdData.error ?? `Could not add ${name}.`);
          resolvedTechStack.push(createdData.item._id);
        }
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not prepare the technology stack.");
      setBusy(false);
      return;
    }

    resolvedTechStack = Array.from(new Set(resolvedTechStack));
    const body = {
      ...draft,
      techStack: resolvedTechStack,
      status: nextStatus ?? draft.status,
      price: draft.price === "" ? undefined : Number(draft.price),
      discountPrice:
        draft.discountPrice === "" ? undefined : Number(draft.discountPrice),
      packages: draft.packages.map((item) => ({
        ...item,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        platforms: item.platforms.filter(Boolean),
        features: item.features.filter(Boolean),
      })),
    };

    try {
      const response = await adminFetch(
        isNew ? "/api/admin/products" : `/api/admin/products/${draft._id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Could not save.");
        return;
      }

      setSaved(true);
      if (isNew) router.push(`/admin/products/${data.product._id}`);
      else {
        if (nextStatus) set("status", nextStatus);
        router.refresh();
      }
    } catch {
      setFormError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const canPublish = Boolean(
    draft.provenance === "in_house" || draft.provenanceDocKey
  );

  return (
    <div className="space-y-6">
      <Section title="Description">
        <Field
          label="Title"
          required
          value={draft.title}
          error={errors.title}
          onChange={(v) => set("title", v)}
          hint={
            isNew
              ? "The URL is built from this and then fixed — later title edits won't change it."
              : undefined
          }
        />
        {!isNew && <Field label="Product URL slug" value={draft.slug ?? ""} error={errors.slug} onChange={(v) => set("slug", v.toLowerCase().trim().replace(/\s+/g, "-"))} hint="Changing this also changes the public product URL. Update any links that use the old URL." />}
        <Field
          label="One-line summary"
          required
          value={draft.shortDescription}
          error={errors.shortDescription}
          onChange={(v) => set("shortDescription", v)}
          hint={`Shown on cards and in search results. ${draft.shortDescription.length}/300`}
        />
        <Field
          label="Full description"
          textarea
          rows={6}
          value={draft.description}
          onChange={(v) => set("description", v)}
        />
        <ListField
          label="Key features"
          values={draft.features}
          onChange={(v) => set("features", v)}
          placeholder="Multi-doctor appointment scheduling"
        />
        <SingleImageUpload
          label="Website cover image"
          value={draft.thumbnail}
          onChange={(value) => set("thumbnail", value)}
          aspect="cover"
          hint="Choose an image from your computer or phone gallery. It appears beside the product title and on catalogue cards; a 4:3 image works best."
        />
        <ListField
          label="What's included"
          values={draft.included}
          onChange={(v) => set("included", v)}
          placeholder="Complete source code"
        />
        <div>
          <p className="label-muted">Additional product images</p>
          <p className="mb-3 mt-1 text-xs text-ink-faint">Upload product screens from your device. Add or remove up to twelve images; 3–4 strong screenshots are recommended.</p>
          <ImageUploader images={draft.images} onChange={(images) => set("images", images)} maxImages={12} />
        </div>
      </Section>

      <Section title="Classification">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label-muted">
              Industry <span className="text-accent-deep">*</span>
            </span>
            <select
              value={draft.industry}
              onChange={(e) => set("industry", e.target.value)}
              className={`field mt-1.5 ${errors.industry ? "field-error" : ""}`}
            >
              <option value="">Choose one</option>
              {industries.map((industry) => (
                <option key={industry._id} value={industry._id}>
                  {industry.name}
                </option>
              ))}
            </select>
            {errors.industry && <Err>{errors.industry}</Err>}
          </label>

          <label className="block">
            <span className="label-muted">
              Platform <span className="text-accent-deep">*</span>
            </span>
            <select
              value={draft.platform}
              onChange={(e) => set("platform", e.target.value as Platform)}
              className={`field mt-1.5 ${errors.platform ? "field-error" : ""}`}
            >
              <option value="">Choose one</option>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {PLATFORM_LABELS[platform]}
                </option>
              ))}
            </select>
            {errors.platform && <Err>{errors.platform}</Err>}
          </label>
        </div>

        <div>
          <span className="label-muted">Technology stack</span>
          <p className="mt-1 text-xs text-ink-faint">Type the technologies used in each layer, separated by commas. New names are created automatically when the product is saved.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(Object.keys(TECH_CATEGORY_LABELS) as TechCategory[]).map((category) => (
              <label key={category} className="block"><span className="label-muted">{TECH_CATEGORY_LABELS[category]}</span><input value={techNames[category]} onChange={(event) => { setTechNames({ ...techNames, [category]: event.target.value }); setSaved(false); }} placeholder={category === "frontend" ? "React, Next.js" : category === "backend" ? "Node.js, Laravel" : category === "database" ? "MongoDB, PostgreSQL" : category === "mobile" ? "Flutter, React Native" : "Docker, Redis, AI/ML"} className="field mt-1.5" /></label>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Pricing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="List price (₹)"
            required
            type="number"
            value={String(draft.price)}
            error={errors.price}
            onChange={(v) => set("price", v === "" ? "" : Number(v))}
            hint="Excluding GST — 18% is added at checkout."
          />
          <Field
            label="Offer price (₹)"
            type="number"
            value={String(draft.discountPrice)}
            error={errors.discountPrice}
            onChange={(v) => set("discountPrice", v === "" ? "" : Number(v))}
            hint="Leave blank for no discount."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="SAC code"
            value={draft.sacCode}
            onChange={(v) => set("sacCode", v)}
            hint="Software licence default: 997331. Confirm with your CA."
          />
          <Field
            label="GST rate (%)"
            type="number"
            value={String(draft.gstRate)}
            onChange={(v) => set("gstRate", v === "" ? "" : Number(v))}
          />
        </div>
        <div className="border-t border-rule pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-sm font-semibold text-ink">Purchase packages</h3><p className="mt-1 text-xs text-ink-faint">Customers choose one package. Its price is checked again on the server at checkout.</p></div>
            <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => set("packages", [...draft.packages, { id: `package-${Date.now()}`, name: "New package", description: "", platforms: ["Web"], price: Number(draft.discountPrice || draft.price || 0), features: [], isPopular: false }])}>+ Add package</button>
          </div>
          {errors.packages && <Err>{errors.packages}</Err>}
          <div className="mt-4 space-y-4">
            {draft.packages.map((item, index) => {
              const update = (patch: Partial<ProductPackage>) => set("packages", draft.packages.map((entry, i) => i === index ? { ...entry, ...patch } : entry));
              return <div key={item.id} className="rounded-xl border border-rule bg-paper-alt/40 p-4">
                <div className="mb-4 flex items-center justify-between gap-3"><strong className="text-sm text-ink">Package {index + 1}</strong><button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => set("packages", draft.packages.filter((_, i) => i !== index))}>Remove</button></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Package name" value={item.name} onChange={(value) => update({ name: value })} />
                  <Field label="Package ID" value={item.id} onChange={(value) => update({ id: value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} hint="Stable checkout identifier; use letters, numbers and hyphens." />
                  <Field label="Sale price (₹)" type="number" value={String(item.price)} onChange={(value) => update({ price: Number(value) })} />
                  <Field label="List price (₹)" type="number" value={item.originalPrice ? String(item.originalPrice) : ""} onChange={(value) => update({ originalPrice: value ? Number(value) : undefined })} />
                </div>
                <Field label="Short description" value={item.description} onChange={(value) => update({ description: value })} />
                <Field label="Platforms" value={item.platforms.join(", ")} onChange={(value) => update({ platforms: value.split(",").map((part) => part.trim()).filter(Boolean) })} hint="Comma-separated, e.g. Web, Android, iOS, AI" />
                <ListField label="Package-specific benefits" values={item.features} onChange={(features) => update({ features })} placeholder="Complete source code" />
                <label className="flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" checked={Boolean(item.isPopular)} onChange={(event) => set("packages", draft.packages.map((entry, i) => ({ ...entry, isPopular: event.target.checked && i === index })))} className="h-4 w-4 accent-accent-deep" />Mark as most popular</label>
              </div>;
            })}
            {!draft.packages.length && <p className="rounded-lg border border-dashed border-rule p-4 text-sm text-ink-soft">No packages yet. The product’s offer price will be used until you add them.</p>}
          </div>
        </div>
      </Section>

      <Section title="Demo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Live demo URL"
            value={draft.demo.webUrl}
            onChange={(v) => set("demo", { ...draft.demo, webUrl: v })}
          />
          <Field
            label="Admin demo URL"
            value={draft.demo.adminUrl}
            onChange={(v) => set("demo", { ...draft.demo, adminUrl: v })}
          />
          <Field
            label="Demo username"
            value={draft.demo.adminUser}
            onChange={(v) => set("demo", { ...draft.demo, adminUser: v })}
          />
          <Field
            label="Demo password"
            value={draft.demo.adminPass}
            onChange={(v) => set("demo", { ...draft.demo, adminPass: v })}
          />
          <Field
            label="Google Play link"
            value={draft.demo.playStoreUrl}
            onChange={(v) => set("demo", { ...draft.demo, playStoreUrl: v })}
            hint="Optional. Shown only when provided."
          />
          <Field
            label="Apple App Store link"
            value={draft.demo.appStoreUrl}
            onChange={(v) => set("demo", { ...draft.demo, appStoreUrl: v })}
            hint="Optional. Shown only when provided."
          />
          <div className="sm:col-span-2">
            <SingleVideoUpload
              label="Workflow video"
              value={draft.demo.workflowVideoUrl}
              onChange={(v) => set("demo", { ...draft.demo, workflowVideoUrl: v })}
              hint="Upload from your phone or computer. The file is saved securely in your Cloudinary product-video folder."
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Or paste a workflow video URL"
              value={draft.demo.workflowVideoUrl}
              onChange={(v) => set("demo", { ...draft.demo, workflowVideoUrl: v })}
              hint="Optional alternative: YouTube, Vimeo or a direct MP4/WebM link."
            />
          </div>
        </div>
        <Callout tone="warn">
          These are shown publicly on the product page, in full. Use throwaway
          credentials on a sandbox that resets, and never one that works
          anywhere else.
        </Callout>
      </Section>

      <Section title="Requirements">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Server"
            value={draft.requirements.server}
            onChange={(v) => set("requirements", { ...draft.requirements, server: v })}
          />
          <Field
            label="Runtime"
            value={draft.requirements.language}
            onChange={(v) =>
              set("requirements", { ...draft.requirements, language: v })
            }
          />
          <Field
            label="Database"
            value={draft.requirements.database}
            onChange={(v) =>
              set("requirements", { ...draft.requirements, database: v })
            }
          />
        </div>
      </Section>

      <Section title="Rights and delivery">
        <label className="block">
          <span className="label-muted">Where this came from</span>
          <select
            value={draft.provenance}
            onChange={(e) => set("provenance", e.target.value as LicenseProvenance)}
            className="field mt-1.5"
          >
            <option value="in_house">Built in-house</option>
            <option value="reseller">Resold under agreement</option>
            <option value="licensed">Licensed from the author</option>
          </select>
        </label>

        {draft.provenance !== "in_house" && (
          <>
            <Field
              label="Right-to-resell document"
              value={draft.provenanceDocKey}
              error={errors.provenanceDocKey}
              onChange={(v) => set("provenanceDocKey", v)}
              hint="A link or storage key for the signed agreement. Required before this can go live."
            />
            <Callout tone="warn">
              Publishing is blocked until this is filled in. It&apos;s the only
              evidence you can sell this if anyone ever asks.
            </Callout>
          </>
        )}

        <Field
          label="GitHub repository"
          value={draft.githubRepo}
          error={errors.githubRepo}
          onChange={(v) => set("githubRepo", v)}
          hint="owner/repo — used for collaborator invites. Never shown publicly."
        />
        <Field
          label="Documentation URL"
          value={draft.documentationUrl}
          onChange={(v) => set("documentationUrl", v)}
        />

      </Section>

      <Section title="Search listing">
        <Field
          label="Meta title"
          value={draft.seo.metaTitle}
          onChange={(v) => set("seo", { ...draft.seo, metaTitle: v })}
          hint="Falls back to the product title if blank."
        />
        <Field
          label="Meta description"
          textarea
          rows={2}
          value={draft.seo.metaDescription}
          onChange={(v) => set("seo", { ...draft.seo, metaDescription: v })}
          hint="Around 155 characters shows in full on Google."
        />
        <Field label="Social sharing image URL" value={draft.seo.ogImage} onChange={(v) => set("seo", { ...draft.seo, ogImage: v })} hint="Used when this product is shared on social media. Falls back to the cover image." />
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
            className="h-4 w-4 accent-accent-deep"
          />
          Feature on the homepage
        </label>
      </Section>

      {formError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {formError}
        </p>
      )}
      {saved && !formError && (
        <p className="text-sm font-medium text-save">Saved.</p>
      )}

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-xl bg-paper p-4 shadow-lift ring-1 ring-rule-soft">
        <button
          type="button"
          onClick={() => save()}
          disabled={busy}
          className="btn-secondary"
        >
          {busy ? "Saving…" : "Save"}
        </button>

        {draft.status === "published" ? (
          <button
            type="button"
            onClick={() => save("draft")}
            disabled={busy}
            className="btn-quiet"
          >
            Unpublish
          </button>
        ) : (
          <button
            type="button"
            onClick={() => save("published")}
            disabled={busy || !canPublish || isNew}
            className="btn-primary"
          >
            Publish
          </button>
        )}

        <span className="text-xs text-ink-faint">
          {isNew
            ? "Save the product first, then publish it."
            : draft.provenance !== "in_house" && !draft.provenanceDocKey
                ? "Right-to-resell documentation is required before publishing."
                : draft.status === "published"
                  ? `Live in the catalogue${licenseCount ? ` · ${licenseCount} sold` : ""}`
                  : "Ready to publish."}
        </span>
        {draft.slug && draft.status === "published" && (
          <a
            href={`/product/${draft.slug}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-sm font-medium text-accent-deep hover:underline"
          >
            View live product →
          </a>
        )}
        {draft._id && <div className="ml-auto"><ProductActions productId={draft._id} productTitle={draft.title} soldCount={licenseCount} editOnly /></div>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="panel-head">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs text-red-700">{children}</span>;
}

function Callout({
  tone,
  children,
}: {
  tone: "warn";
  children: React.ReactNode;
}) {
  return (
    <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
      {children}
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  type = "text",
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="label-muted">
        {label} {required && <span className="text-accent-deep">*</span>}
      </span>
      {textarea ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className={`field mt-1.5 ${error ? "field-error" : ""}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`field mt-1.5 ${error ? "field-error" : ""}`}
        />
      )}
      {error ? <Err>{error}</Err> : hint ? (
        <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}

/**
 * Repeating text rows. A textarea split on newlines would be less code, but
 * it loses the ordering handles and makes a stray blank line into an empty
 * feature bullet on the live page.
 */
function ListField({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <span className="label-muted">{label}</span>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      <div className="mt-2 space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={value}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[index] = e.target.value;
                onChange(next);
              }}
              className="field"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={`Remove item ${index + 1}`}
              className="btn-secondary px-3"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="btn-quiet mt-2 px-3 py-1.5 text-xs"
      >
        + Add
      </button>
    </div>
  );
}
