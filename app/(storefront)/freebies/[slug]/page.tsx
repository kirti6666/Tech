/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Download, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { getFreeResourceBySlug } from "@/lib/free-resources";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const resource = await getFreeResourceBySlug(params.slug);
  return resource ? { title: `${resource.title} — free download | TechBro`, description: resource.description || resource.subtitle, alternates: { canonical: `/freebies/${resource.slug}` } } : {};
}

export default async function FreeResourceDetailPage({ params }: { params: { slug: string } }) {
  const resource = await getFreeResourceBySlug(params.slug);
  if (!resource) notFound();
  const images = [resource.coverImage, ...resource.galleryImages].filter(Boolean);

  const media = <div>
    <div className="overflow-hidden rounded-[10px] border border-rule bg-gradient-to-br from-[#071a3d] via-[#123b78] to-[#6596e4]">
      {images[0] ? <img src={images[0]} alt={resource.title} className="h-auto max-h-[32rem] w-full object-contain" /> : <div className="flex aspect-[16/9] flex-col justify-end p-5 text-white sm:p-8"><FileText size={28} className="mb-3 opacity-70" /><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-200">TechBro free resource</p><p className="mt-1.5 max-w-2xl font-display text-2xl font-semibold leading-tight sm:text-4xl">{resource.title}</p></div>}
    </div>
    {images.length > 1 && <div className="mt-2 grid grid-cols-3 gap-2">{images.slice(1, 4).map((image) => <div key={image} className="overflow-hidden rounded-[10px] border border-rule bg-paper-alt"><img src={image} alt="Resource preview" className="aspect-[4/3] h-full w-full object-cover" /></div>)}</div>}
  </div>;

  return (
    <main className="mx-auto max-w-shell px-3 py-3 sm:px-6 sm:py-7">
      <Link href="/freebies" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-deep hover:underline sm:text-sm"><ArrowLeft size={14} /> Free resources</Link>
      <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.65fr)] lg:gap-x-7 lg:gap-y-5">
        <div className="lg:col-start-1 lg:row-start-1">{media}</div>

        <aside className="rounded-[10px] border border-rule bg-white p-4 shadow-card lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 sm:p-5">
          <span className="inline-flex rounded-full bg-accent-wash px-2.5 py-1 text-[10px] font-bold text-accent-deep sm:text-xs">{resource.category}</span>
          <h1 className="mt-2.5 font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">{resource.title}</h1>
          <p className="mt-2 text-xs leading-5 text-ink-soft sm:text-sm sm:leading-6">{resource.subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-rule-soft py-3 text-[10px] text-ink-faint sm:text-xs"><span className="inline-flex items-center gap-1.5"><Download size={13} /> {resource.downloadCount.toLocaleString("en-IN")} downloads</span><span className="inline-flex items-center gap-1.5"><Sparkles size={13} /> Digital download</span></div>
          <div className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-extrabold text-save">FREE</span>{resource.originalPrice > 0 && <span className="text-xs text-ink-faint line-through">₹{resource.originalPrice.toLocaleString("en-IN")}</span>}</div>
          {resource.downloadUrl ? <a href={resource.downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 flex w-full items-center justify-center gap-2 py-2.5"><Download size={15} /> Get it now for free</a> : <button disabled className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[10px] bg-accent-wash px-4 py-2.5 text-xs font-bold text-accent-deep sm:text-sm"><Download size={15} /> Download link coming soon</button>}
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <section className="border-t border-rule pt-4 sm:pt-5"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-accent">Overview</p><h2 className="mt-1 font-display text-xl font-semibold text-ink sm:text-2xl">What you’ll get</h2><p className="mt-2 max-w-3xl whitespace-pre-line text-xs leading-6 text-ink-soft sm:text-sm sm:leading-7">{resource.overview || resource.description}</p><div className="mt-3 grid gap-1.5 sm:grid-cols-2">{resource.highlights.map((item) => <div key={item} className="flex items-start gap-2 rounded-[10px] border border-rule bg-paper-alt p-2.5 text-xs font-medium text-ink sm:text-sm"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blue-100 text-accent"><Check size={11} /></span>{item}</div>)}</div></section>
          {resource.sections.map((section, index) => <section key={`${section.heading}-${index}`} className="mt-5 border-t border-rule pt-4"><div className={section.image ? "grid items-center gap-4 sm:grid-cols-2" : ""}><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-accent">Inside the resource</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">{section.heading}</h2><p className="mt-2 whitespace-pre-line text-xs leading-6 text-ink-soft sm:text-sm">{section.body}</p></div>{section.image && <img src={section.image} alt="" className="rounded-[10px] border border-rule" />}</div></section>)}
          <section className="mt-5 rounded-[10px] border border-rule bg-paper-alt p-4"><h2 className="font-display text-lg font-semibold text-ink">Deal terms</h2><ul className="mt-2 space-y-1.5">{resource.terms.map((term) => <li key={term} className="flex gap-2 text-xs text-ink-soft sm:text-sm"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-save" />{term}</li>)}</ul></section>
        </div>
      </div>
    </main>
  );
}
