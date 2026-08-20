"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { adminFetch } from "@/lib/adminFetch";
import { slugify } from "@/lib/slugify";

export interface BlogPostDraft {
  _id?: string; title: string; slug: string; excerpt: string; category: string; coverImage: string;
  author: string; authorRole: string; intro: string; sections: { heading: string; body: string; image: string }[];
  readTime: number; publishedAt: string; featured: boolean; status: "draft" | "published";
}
const field = "mt-1.5 w-full rounded-xl border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";
const label = "text-xs font-bold uppercase tracking-[.08em] text-ink-faint";

export function BlogPostForm({ initial }: { initial: BlogPostDraft }) {
  const router = useRouter(); const [draft, setDraft] = useState(initial); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const set = <K extends keyof BlogPostDraft>(key: K, value: BlogPostDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function save() {
    setSaving(true); setError("");
    const body = { ...draft, slug: draft.slug || slugify(draft.title), sections: draft.sections.filter((section) => section.heading.trim() && section.body.trim()), publishedAt: new Date(draft.publishedAt).toISOString() };
    const response = await adminFetch(draft._id ? `/api/admin/blog/${draft._id}` : "/api/admin/blog", { method: draft._id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Could not save this article"); setSaving(false); return; }
    if (!draft._id) router.replace(`/admin/blog/${data.post._id}`); router.refresh(); setSaving(false);
  }
  return <div className="space-y-5">{error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    <section className="card p-4 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className={label}>Article title *</span><input value={draft.title} onChange={(e) => set("title", e.target.value)} className={field} /></label><label><span className={label}>Category *</span><input value={draft.category} onChange={(e) => set("category", e.target.value)} className={field} placeholder="Launch guides" /></label><label><span className={label}>URL slug</span><input value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} className={field} placeholder="Generated from title" /></label><label className="sm:col-span-2"><span className={label}>Card excerpt *</span><textarea value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={`${field} min-h-24`} /></label></div></section>
    <section className="card p-4 sm:p-6"><h2 className="font-display text-xl font-semibold text-ink">Cover and author</h2><div className="mt-4"><SingleImageUpload label="Cover image" hint="Displayed on the blog card and at the top of the article." aspect="banner" value={draft.coverImage} onChange={(value) => set("coverImage", value)} /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className={label}>Author</span><input value={draft.author} onChange={(e) => set("author", e.target.value)} className={field} /></label><label><span className={label}>Author role</span><input value={draft.authorRole} onChange={(e) => set("authorRole", e.target.value)} className={field} /></label></div></section>
    <section className="card p-4 sm:p-6"><h2 className="font-display text-xl font-semibold text-ink">Article content</h2><label className="mt-4 block"><span className={label}>Opening paragraph *</span><textarea value={draft.intro} onChange={(e) => set("intro", e.target.value)} className={`${field} min-h-32`} /></label><div className="mt-5 space-y-4">{draft.sections.map((section, index) => <article key={index} className="rounded-xl border border-rule bg-paper-alt p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold text-ink">Section {index + 1}</p><button type="button" onClick={() => set("sections", draft.sections.filter((_, i) => i !== index))} className="text-red-700" aria-label={`Delete section ${index + 1}`}><Trash2 size={16} /></button></div><input className={field} placeholder="Section heading" value={section.heading} onChange={(e) => { const sections = [...draft.sections]; sections[index] = { ...section, heading: e.target.value }; set("sections", sections); }} /><textarea className={`${field} min-h-36`} placeholder="Section body. Use blank lines between paragraphs." value={section.body} onChange={(e) => { const sections = [...draft.sections]; sections[index] = { ...section, body: e.target.value }; set("sections", sections); }} /><div className="mt-4"><SingleImageUpload label="Optional section image" aspect="banner" value={section.image} onChange={(image) => { const sections = [...draft.sections]; sections[index] = { ...section, image }; set("sections", sections); }} /></div></article>)}</div><button type="button" onClick={() => set("sections", [...draft.sections, { heading: "", body: "", image: "" }])} className="btn-secondary mt-4 inline-flex items-center gap-2"><Plus size={15} /> Add section</button></section>
    <section className="card p-4 sm:p-6"><h2 className="font-display text-xl font-semibold text-ink">Publishing</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><label><span className={label}>Publish date</span><input type="date" value={draft.publishedAt.slice(0, 10)} onChange={(e) => set("publishedAt", e.target.value)} className={field} /></label><label><span className={label}>Reading time (minutes)</span><input type="number" min="1" max="120" value={draft.readTime} onChange={(e) => set("readTime", Number(e.target.value))} className={field} /></label><label><span className={label}>Status</span><select value={draft.status} onChange={(e) => set("status", e.target.value as "draft" | "published")} className={field}><option value="draft">Draft</option><option value="published">Published</option></select></label></div><label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" checked={draft.featured} onChange={(e) => set("featured", e.target.checked)} /> Feature this article on the blog page</label></section>
    <div className="sticky bottom-3 z-10 flex justify-end rounded-2xl border border-rule bg-white/90 p-3 shadow-lift backdrop-blur"><button type="button" onClick={save} disabled={saving} className="btn-primary inline-flex items-center gap-2"><Save size={16} /> {saving ? "Saving…" : "Save article"}</button></div>
  </div>;
}
