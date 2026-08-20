import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { FreeResourceData } from "@/lib/free-resources";

const TONES = ["bg-[#dff3ea]", "bg-[#e8eef8]", "bg-[#f2e9f5]", "bg-[#f5eee4]"];

export function FreeResourceCard({ resource, index = 0 }: { resource: FreeResourceData; index?: number }) {
  return (
    <article className="group relative min-w-0 bg-white">
      <Link href={`/freebies/${resource.slug}`} aria-label={resource.title} className="block overflow-hidden rounded-[10px]">
        <div className={`flex aspect-[16/10] items-center justify-center overflow-hidden ${TONES[index % TONES.length]}`}>
          {resource.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resource.coverImage} alt={resource.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <ImageIcon size={28} strokeWidth={1.4} className="text-ink-ghost" aria-hidden="true" />
          )}
        </div>
      </Link>
      <div className="pt-2 sm:pt-3">
        <h2 className="line-clamp-2 font-sans text-sm font-extrabold leading-snug text-ink sm:text-base"><Link href={`/freebies/${resource.slug}`} className="after:absolute after:inset-0">{resource.title}</Link></h2>
        <p className="mt-0.5 text-[11px] leading-4 text-ink sm:text-sm">in <span className="underline underline-offset-2">{resource.category}</span></p>
        <p className="mt-1.5 line-clamp-3 text-xs leading-[1.35] text-ink sm:text-sm sm:leading-5">{resource.subtitle || resource.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] sm:text-sm"><span className="tracking-[-0.08em] text-[#f5b800]" aria-label="Five stars">★★★★★</span><span className="text-accent">{resource.downloadCount.toLocaleString("en-IN")} downloads</span></div>
        <p className="mt-2 text-base font-extrabold uppercase text-ink sm:text-lg">Free</p>
      </div>
    </article>
  );
}
