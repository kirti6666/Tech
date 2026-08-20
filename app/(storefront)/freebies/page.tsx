import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";
import { getPublishedFreeResources } from "@/lib/free-resources";
import { FreeResourceCard } from "@/components/storefront/FreeResourceCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free business resources, templates and guides | TechBro",
  description: "Download practical TechBro guides, templates and founder resources at no cost.",
  alternates: { canonical: "/freebies" },
};

export default async function FreebiesPage({ searchParams }: { searchParams: { q?: string; sort?: string } }) {
  const allResources = await getPublishedFreeResources();
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const sort = searchParams.sort === "newest" ? "newest" : "popular";
  const resources = allResources
    .filter((resource) => !query || `${resource.title} ${resource.subtitle} ${resource.category}`.toLowerCase().includes(query))
    .sort((a, b) => sort === "popular" ? b.downloadCount - a.downloadCount : String(b._id).localeCompare(String(a._id)));

  return (
    <main className="mx-auto max-w-shell px-3 py-3 sm:px-6 sm:py-8">
      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)_82px_60px] gap-1.5 border-b border-rule pb-3 sm:ml-auto sm:max-w-2xl sm:grid-cols-[minmax(0,1fr)_112px_86px] sm:gap-2 sm:pb-5" action="/freebies">
        <label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" /><input name="q" defaultValue={searchParams.q} placeholder="Search free resources" className="h-10 w-full min-w-0 rounded-[10px] border border-rule bg-paper-alt pl-9 pr-2 text-xs outline-none transition focus:border-accent sm:h-11 sm:text-sm" /></label>
        <label className="relative min-w-0"><SlidersHorizontal size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-faint" /><select name="sort" defaultValue={sort} className="h-10 w-full appearance-none rounded-[10px] border border-rule bg-white pl-6 pr-0.5 text-[10px] font-bold text-ink outline-none sm:h-11 sm:pl-8 sm:text-xs"><option value="popular">Popular</option><option value="newest">Newest</option></select></label>
        <button className="h-10 min-w-0 rounded-[10px] bg-accent-deep px-1 text-[10px] font-extrabold text-white shadow-accent sm:h-11 sm:px-3 sm:text-sm">Search</button>
      </form>

      {resources.length ? (
        <section aria-label={`${resources.length} free resources`} className="mt-4 grid grid-cols-2 gap-x-3 gap-y-7 sm:mt-6 sm:gap-x-5 sm:gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {resources.map((resource, index) => <FreeResourceCard key={resource._id} resource={resource} index={index} />)}
        </section>
      ) : <div className="mt-8 rounded-2xl border border-dashed border-rule p-12 text-center text-sm text-ink-faint">No resources match that search.</div>}
    </main>
  );
}
