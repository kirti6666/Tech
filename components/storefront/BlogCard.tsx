import Link from "next/link";
import Image from "next/image";
import type { BlogPostData } from "@/lib/blog-posts";

export function BlogCard({ post }: { post: BlogPostData }) {
  return (
    <article className="group relative grid grid-cols-2 items-stretch overflow-hidden rounded-xl border border-rule bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:block sm:rounded-2xl">
      <Link href={`/blog/${post.slug}`} className="block overflow-hidden" aria-label={`Read ${post.title}`}>
        <div className="relative h-full min-h-36 w-full overflow-hidden bg-paper-alt sm:aspect-square sm:min-h-0">
          {post.coverImage ? <Image src={post.coverImage} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="h-full w-full bg-gradient-to-br from-accent-deep to-accent" />}
        </div>
      </Link>
      <div className="flex min-w-0 flex-col justify-center p-3 sm:p-5">
        <h2 className="line-clamp-3 font-display text-sm font-extrabold leading-snug tracking-[-.02em] text-ink sm:text-xl"><Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">{post.title}</Link></h2>
        <p className="mt-2 line-clamp-3 text-[10px] leading-4 text-ink-soft sm:text-sm sm:leading-6">{post.excerpt}</p>
      </div>
    </article>
  );
}
