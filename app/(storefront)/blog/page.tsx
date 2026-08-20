import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import { getPublishedBlogPosts } from "@/lib/blog-posts";
import { BlogCard } from "@/components/storefront/BlogCard";

export const revalidate = 900;
export const metadata: Metadata = { title: "Business, software and launch guides | TechBro Blog", description: "Practical guides for choosing, launching and growing business software.", alternates: { canonical: "/blog" } };

export default async function BlogPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const allPosts = await getPublishedBlogPosts();
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const selectedCategory = (searchParams.category ?? "").trim();
  const posts = allPosts.filter((post) => (!query || `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(query)) && (!selectedCategory || post.category === selectedCategory));
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const rest = posts.filter((post) => post._id !== featured?._id);
  const categories = Array.from(new Set(allPosts.map((post) => post.category)));

  return (
    <main className="bg-white">
      <section className="border-b border-rule-soft bg-accent-mist/30 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-2xl">
          <form action="/blog" className="flex gap-2"><label className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" /><input name="q" defaultValue={searchParams.q} placeholder="Search articles" aria-label="Search blog articles" className="h-10 w-full rounded-xl border border-rule bg-white pl-10 pr-3 text-sm outline-none transition focus:border-accent sm:h-11" /></label><button className="btn-primary min-h-10 rounded-xl px-4 text-xs sm:min-h-11 sm:px-5 sm:text-sm">Search</button></form>
          <nav aria-label="Blog categories" className="hide-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1.5 pt-0.5 [scroll-padding-inline:1rem] sm:mx-0 sm:px-0 sm:[scroll-padding-inline:0px]">
            <Link href="/blog" className={`inline-flex min-h-8 shrink-0 snap-start items-center justify-center rounded-full border px-3 py-1.5 text-[10px] font-bold transition sm:text-xs ${!selectedCategory ? "border-accent bg-accent text-white" : "border-rule bg-white text-ink-soft hover:border-blue-300 hover:text-accent-deep"}`}>All stories</Link>
            {categories.map((category) => <Link key={category} href={`/blog?category=${encodeURIComponent(category)}`} className={`inline-flex min-h-8 shrink-0 snap-start items-center justify-center rounded-full border px-3 py-1.5 text-[10px] font-bold transition sm:text-xs ${selectedCategory === category ? "border-accent bg-accent text-white" : "border-rule bg-white text-ink-soft hover:border-blue-300 hover:text-accent-deep"}`}>{category}</Link>)}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-shell px-3 py-4 sm:px-6 sm:py-10">
        {featured ? <article className="grid overflow-hidden rounded-2xl border border-rule bg-[#071a3d] text-white shadow-lift sm:rounded-3xl lg:grid-cols-[1.08fr_.92fr]">
          <div className="order-2 flex flex-col justify-center p-4 sm:p-8 lg:order-1 lg:p-12"><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-blue-200 sm:text-[10px]">Featured · {featured.category}</p><h2 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-[-.03em] sm:mt-3 sm:text-4xl">{featured.title}</h2><p className="mt-2 line-clamp-3 text-xs leading-5 text-blue-100/75 sm:mt-4 sm:text-base sm:leading-6">{featured.excerpt}</p><div className="mt-3 flex items-center gap-2 text-[10px] text-blue-100/70 sm:mt-5 sm:text-xs"><span>{featured.author}</span><span aria-hidden="true">•</span><span>{featured.readTime} min read</span></div><Link href={`/blog/${featured.slug}`} className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-extrabold text-accent-deep sm:mt-7 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm">Read the story <ArrowRight size={14} /></Link></div>
          <Link href={`/blog/${featured.slug}`} className="relative order-1 min-h-44 overflow-hidden sm:min-h-60 lg:order-2">{featured.coverImage ? <Image src={featured.coverImage} alt="" fill priority sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" /> : <div className="h-full bg-accent" />}</Link>
        </article> : <div className="mt-10 rounded-2xl border border-dashed border-rule p-12 text-center text-sm text-ink-faint">No articles match your search.</div>}

        {rest.length > 0 && <section className="mt-7 sm:mt-12" aria-labelledby="latest-blog-heading"><div className="flex items-end justify-between"><div><p className="label">Latest insights</p><h2 id="latest-blog-heading" className="mt-1 font-display text-xl font-extrabold text-ink sm:text-3xl">More from TechBro</h2></div><span className="text-[10px] text-ink-faint sm:text-xs">{posts.length} articles</span></div><div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">{rest.map((post) => <BlogCard key={post._id} post={post} />)}</div></section>}
      </div>
    </main>
  );
}
