"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { adminFetch } from "@/lib/adminFetch";
import { slugify } from "@/lib/slugify";

export interface FreeResourceDraft {
  _id?: string;
  title: string; slug: string; subtitle: string; category: string; description: string;
  coverImage: string; galleryImages: string[]; overview: string; highlights: string[]; terms: string[];
  sections: { heading: string; body: string; image: string }[];
  downloadUrl: string; downloadCount: number; originalPrice: number; featured: boolean; status: "draft" | "published";
}

const input = "mt-1.5 w-full rounded-xl border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";
const label = "text-xs font-bold uppercase tracking-[.08em] text-ink-faint";

export function FreeResourceForm({ initial }: { initial: FreeResourceDraft }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof FreeResourceDraft>(key: K, value: FreeResourceDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true); setError("");
    const body = { ...draft, slug: draft.slug || slugify(draft.title), galleryImages: draft.galleryImages.filter(Boolean), highlights: draft.highlights.filter(Boolean), terms: draft.terms.filter(Boolean), sections: draft.sections.filter((section) => section.heading.trim()) };
    const response = await adminFetch(draft._id ? `/api/admin/freebies/${draft._id}` : "/api/admin/freebies", { method: draft._id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Could not save this resource"); setSaving(false); return; }
    if (!draft._id) router.replace(`/admin/freebies/${data.resource._id}`);
    router.refresh(); setSaving(false);
  }

  return <div className="space-y-5">
    {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    <section className="card p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className={label}>Title *</span><input className={input} value={draft.title} onChange={(e) => set("title", e.target.value)} /></label>
        <label><span className={label}>Category *</span><input className={input} value={draft.category} onChange={(e) => set("category", e.target.value)} placeholder="Marketing, SaaS, Productivity…" /></label>
        <label className="sm:col-span-2"><span className={label}>URL slug</span><input className={input} value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="Generated from the title" /></label>
        <label className="sm:col-span-2"><span className={label}>Short subtitle</span><input className={input} value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></label>
        <label className="sm:col-span-2"><span className={label}>Card description</span><textarea className={`${input} min-h-24`} value={draft.description} onChange={(e) => set("description", e.target.value)} /></label>
      </div>
    </section>

    <section className="card p-4 sm:p-6"><h2 className="font-display text-xl font-semibold text-ink">Cover and gallery</h2><div className="mt-4"><SingleImageUpload label="Cover image" hint="Shown on the card and at the top of the detail page." aspect="cover" value={draft.coverImage} onChange={(value) => set("coverImage", value)} /></div><div className="mt-5 grid gap-4 sm:grid-cols-3">{draft.galleryImages.map((value, index) => <SingleImageUpload key={index} label={`Gallery image ${index + 1}`} aspect="cover" value={value} onChange={(next) => { const gallery = [...draft.galleryImages]; if (next) gallery[index] = next; else gallery.splice(index, 1); set("galleryImages", gallery); }} />)}</div>{draft.galleryImages.length < 12 && <button type="button" onClick={() => set("galleryImages", [...draft.galleryImages, ""])} className="btn-secondary mt-4 inline-flex items-center gap-2"><Plus size={15} /> Add gallery image</button>}</section>

    <section className="card p-4 sm:p-6"><h2 className="font-display text-xl font-semibold text-ink">Detail page content</h2><label className="mt-4 block"><span className={label}>Overview</span><textarea className={`${input} min-h-32`} value={draft.overview} onChange={(e) => set("overview", e.target.value)} /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className={label}>Highlights — one per line</span><textarea className={`${input} min-h-32`} value={draft.highlights.join("\n")} onChange={(e) => set("highlights", e.target.value.split("\n"))} /></label><label><span className={label}>Deal terms — one per line</span><textarea className={`${input} min-h-32`} value={draft.terms.join("\n")} onChange={(e) => set("terms", e.target.value.split("\n"))} /></label></div>
      <div className="mt-5 space-y-3">{draft.sections.map((section, index) => <div key={index} className="rounded-xl border border-rule bg-paper-alt p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold text-ink">Content section {index + 1}</p><button type="button" onClick={() => set("sections", draft.sections.filter((_, i) => i !== index))} className="text-red-700"><Trash2 size={16} /></button></div><input className={input} placeholder="Heading" value={section.heading} onChange={(e) => { const sections = [...draft.sections]; sections[index] = { ...section, heading: e.target.value }; set("sections", sections); }} /><textarea className={`${input} min-h-24`} placeholder="Body copy" value={section.body} onChange={(e) => { const sections = [...draft.sections]; sections[index] = { ...section, body: e.target.value }; set("sections", sections); }} /><input className={input} placeholder="Optional section image URL" value={section.image} onChange={(e) => { const sections = [...draft.sections]; sections[index] = { ...section, image: e.target.value }; set("sections", sections); }} /></div>)}</div><button type="button" onClick={() => set("sections", [...draft.sections, { heading: "", body: "", image: "" }])} className="btn-secondary mt-3 inline-flex items-center gap-2"><Plus size={15} /> Add content section</button>
    </section>

    <section className="card p-4 sm:p-6"><h2 className="font-display text-xl font-semibold text-ink">Download and publishing</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className="sm:col-span-3"><span className={label}>Download URL</span><input className={input} value={draft.downloadUrl} onChange={(e) => set("downloadUrl", e.target.value)} placeholder="https://…" /></label><label><span className={label}>Displayed original price (₹)</span><input type="number" min="0" className={input} value={draft.originalPrice} onChange={(e) => set("originalPrice", Number(e.target.value))} /></label><label><span className={label}>Download count</span><input type="number" min="0" className={input} value={draft.downloadCount} onChange={(e) => set("downloadCount", Number(e.target.value))} /></label><label><span className={label}>Status</span><select className={input} value={draft.status} onChange={(e) => set("status", e.target.value as "draft" | "published")}><option value="draft">Draft</option><option value="published">Published</option></select></label></div><label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" checked={draft.featured} onChange={(e) => set("featured", e.target.checked)} /> Feature this resource</label></section>

    <div className="sticky bottom-3 z-10 flex justify-end rounded-2xl border border-rule bg-white/90 p-3 shadow-lift backdrop-blur"><button type="button" onClick={save} disabled={saving} className="btn-primary inline-flex items-center gap-2"><Save size={16} /> {saving ? "Saving…" : "Save resource"}</button></div>
  </div>;
}
