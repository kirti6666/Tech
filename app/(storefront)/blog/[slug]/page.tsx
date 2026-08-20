import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, Clock3 } from "lucide-react";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog-posts";

export const revalidate = 900;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  return post ? {
    title: `${post.title} | TechBro Blog`, description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, images: post.coverImage ? [post.coverImage] : [] },
  } : {};
}

const date = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));

function ArticleText({ children }: { children: string }) {
  const blocks = children
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 sm:space-y-5">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const bullets = lines.every((line) => /^[-•]\s+/.test(line));
        const numbered = lines.every((line) => /^\d+[.)]\s+/.test(line));

        if (bullets) {
          return (
            <ul key={index} className="space-y-2.5 pl-0">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="flex items-start gap-3">
                  <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{line.replace(/^[-•]\s+/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (numbered) {
          return (
            <ol key={index} className="space-y-3 pl-0">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-mist text-[10px] font-extrabold text-accent-deep">
                    {lineIndex + 1}
                  </span>
                  <span>{line.replace(/^\d+[.)]\s+/, "")}</span>
                </li>
              ))}
            </ol>
          );
        }

        return <p key={index}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const [post, posts] = await Promise.all([getBlogPostBySlug(params.slug), getPublishedBlogPosts()]);
  if (!post) notFound();
  const related = posts.filter((item) => item.slug !== post.slug).slice(0, 3);
  const authorInitial = post.author.trim().charAt(0).toUpperCase() || "T";

  return <main className="bg-white">
    <article>
      <header className="border-b border-rule-soft bg-gradient-to-b from-accent-mist/70 to-white px-4 pb-7 pt-5 sm:px-6 sm:pb-12 sm:pt-8 lg:pb-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/blog" className="group inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-ink-soft transition hover:text-accent-deep"><ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> Back to blog</Link>
            <span className="rounded-full border border-blue-100 bg-white px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-accent-deep shadow-sm sm:text-[10px]">{post.category}</span>
          </div>
          <div className="mx-auto mt-7 max-w-4xl text-center sm:mt-10">
            <h1 className="font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-ink sm:text-5xl lg:text-[3.5rem]">{post.title}</h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-ink-soft sm:mt-5 sm:text-lg sm:leading-8">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-[11px] text-ink-faint sm:mt-7 sm:text-sm">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-deep text-xs font-extrabold text-white sm:h-9 sm:w-9">{authorInitial}</span>
              <strong className="text-ink">{post.author}</strong>{post.authorRole && <span className="hidden sm:inline">{post.authorRole}</span>}<span aria-hidden="true">•</span><span>{date(post.publishedAt)}</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> {post.readTime} min read</span>
            </div>
          </div>
        </div>
      </header>

      {post.coverImage && <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8"><div className="overflow-hidden rounded-2xl border border-rule bg-paper-alt shadow-lift"><Image src={post.coverImage} alt={post.title} width={1600} height={900} priority sizes="(max-width: 768px) 100vw, 1152px" className="aspect-[16/9] w-full object-cover" /></div></div>}

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-12">
        <details className="group mb-7 overflow-hidden rounded-[10px] border border-blue-100 bg-white shadow-[0_10px_30px_rgba(15,42,85,0.06)] lg:hidden" open>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="h-5 w-1 shrink-0 rounded-full bg-accent" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-ink">In this article</span>
              <span className="rounded-full bg-accent-mist px-2 py-0.5 text-[9px] font-bold text-accent-deep">{post.sections.length} sections</span>
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper-alt text-ink-soft">
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <ol className="border-t border-rule-soft px-3 py-2">
            {post.sections.map((section, index) => <li key={`${section.heading}-${index}`} className="border-b border-rule-soft last:border-0">
              <a href={`#section-${index + 1}`} className="group/link grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)_1.5rem] items-center gap-2 rounded-lg px-1.5 py-2 text-xs leading-5 text-ink-soft transition hover:bg-accent-mist hover:text-accent-deep">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-paper-alt font-mono text-[9px] font-bold text-accent-deep ring-1 ring-rule-soft">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-semibold">{section.heading}</span>
                <ArrowRight className="h-3.5 w-3.5 justify-self-end text-ink-ghost transition-transform group-hover/link:translate-x-0.5 group-hover/link:text-accent-deep" />
              </a>
            </li>)}
          </ol>
        </details>

        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,43rem)] lg:justify-center lg:gap-12">
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-deep">In this article</p>
            <ol className="mt-4 space-y-1 border-l border-rule pl-4">{post.sections.map((section, index) => <li key={`${section.heading}-${index}`}><a href={`#section-${index + 1}`} className="group flex gap-2 py-1.5 text-xs leading-5 text-ink-faint transition hover:text-accent-deep"><span className="font-mono text-[9px] text-ink-ghost group-hover:text-accent">{String(index + 1).padStart(2, "0")}</span><span>{section.heading}</span></a></li>)}</ol>
            <div className="mt-6 rounded-xl border border-blue-100 bg-accent-mist p-4"><p className="text-xs font-extrabold text-ink">Need help choosing?</p><p className="mt-1.5 text-[11px] leading-5 text-ink-soft">Tell us what you want to build and get a practical recommendation.</p><Link href="/book-consultation" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent-deep">Book a free call <ArrowRight size={12} /></Link></div>
          </aside>

          <div className="min-w-0">
            <div className="rounded-[10px] border border-blue-100 bg-gradient-to-br from-accent-mist/90 to-white p-5 sm:p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-accent-deep">Key takeaway</p>
              <div className="mt-2.5 text-base font-medium leading-7 text-ink sm:text-xl sm:leading-8"><ArticleText>{post.intro}</ArticleText></div>
            </div>

            <div className="mt-8 space-y-9 sm:mt-11 sm:space-y-12">
              {post.sections.map((section, index) => <section id={`section-${index + 1}`} key={`${section.heading}-${index}`} className="scroll-mt-24">
                <header className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 border-b border-rule-soft pb-4 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4 sm:pb-5">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#071a3d] font-mono text-[11px] font-bold text-white sm:h-10 sm:w-10">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="pt-0.5 font-display text-[1.45rem] font-extrabold leading-[1.2] tracking-[-0.025em] text-ink sm:text-[1.8rem]">
                    {section.heading}
                  </h2>
                </header>
                <div className="mt-5 text-[15px] leading-7 text-ink-soft sm:mt-6 sm:text-[17px] sm:leading-8"><ArticleText>{section.body}</ArticleText></div>
                {section.image && <Image src={section.image} alt="" width={1400} height={800} sizes="(max-width: 768px) 100vw, 688px" className="mt-6 aspect-[16/9] w-full rounded-[10px] border border-rule bg-paper-alt object-cover sm:mt-8" />}
              </section>)}
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-gradient-to-r from-accent-mist to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-sm font-extrabold text-ink">Ready to find your starting point?</p><p className="mt-1 text-xs text-ink-soft">Browse ready-made products or discuss a custom build.</p></div><Link href="/shop" className="btn-primary min-h-10 shrink-0 px-4 text-xs">Explore products <ArrowRight size={13} /></Link></div>
          </div>
        </div>
      </div>
    </article>

    {related.length > 0 && <section className="border-t border-rule-soft bg-paper-alt px-4 py-9 sm:px-6 sm:py-14"><div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between gap-4"><div><p className="label">Keep reading</p><h2 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">More practical guides</h2></div><Link href="/blog" className="hidden text-sm font-bold text-accent-deep hover:underline sm:block">View all articles</Link></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <Link key={item.slug} href={`/blog/${item.slug}`} className="group grid min-h-32 grid-cols-[7rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-rule bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift sm:block">
        {item.coverImage ? <Image src={item.coverImage} alt="" width={640} height={360} sizes="(max-width: 640px) 112px, 33vw" className="h-full min-h-32 w-full object-cover sm:aspect-[16/8] sm:h-auto sm:min-h-0" /> : <div className="h-full bg-accent-mist sm:aspect-[16/8]" />}
        <div className="min-w-0 p-3.5 sm:p-4"><p className="text-[9px] font-bold uppercase tracking-[0.13em] text-accent-deep">{item.category}</p><h3 className="mt-1.5 line-clamp-3 font-display text-sm font-extrabold leading-snug text-ink sm:text-base">{item.title}</h3><span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-accent-deep sm:text-xs">Read article <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" /></span></div>
      </Link>)}</div>
    </div></section>}
  </main>;
}
