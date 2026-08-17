import Link from "next/link";
import { PLATFORM_LABELS } from "@/types/catalog";
import { formatPrice, discountPercent } from "@/lib/price";
import type { CatalogueProduct } from "@/lib/catalogue";

/**
 * Card as datasheet header: title, one line of what it is, then the
 * measurable facts in mono. No shadow, no fill — a hairline rule and a
 * accent-deep-blue edge on hover. The screenshot is 16:10 because these are
 * dashboards and admin panels, and a square crop decapitates every one of
 * them.
 *
 * The tech chips are anchors, not buttons: a buyer scanning for "Flutter"
 * should be able to click straight through to the filtered catalogue, and
 * search engines should be able to follow the same path.
 */

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const saving = discountPercent(product.price, product.discountPrice);
  const image = product.thumbnail || product.images?.[0];
  // Four chips fit on one line at the narrowest card width; past that the
  // row wraps and the cards in a grid row stop lining up.
  const chips = product.techStack.slice(0, 4);
  const overflow = product.techStack.length - chips.length;

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-card backdrop-blur-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-lift sm:rounded-3xl">
      <Link
        href={`/product/${product.slug}`}
        className="block focus:outline-none"
        aria-label={product.title}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-paper-alt sm:aspect-[16/10]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />
          ) : (
            <div className="flex h-full items-center justify-center label-muted">
              No preview
            </div>
          )}
          <span className="absolute left-1.5 top-1.5 max-w-[70%] truncate rounded-md bg-paper/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-ink-soft shadow-card backdrop-blur sm:left-3 sm:top-3 sm:max-w-none sm:px-2.5 sm:py-1 sm:text-label sm:font-medium sm:tracking-[0.06em]">
            {PLATFORM_LABELS[product.platform]}
          </span>
          {saving !== null && (
            <span className="absolute right-1.5 top-1.5 rounded-md bg-save px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-white shadow-card sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-label sm:font-medium sm:tracking-[0.06em]">
              <span className="sm:hidden">−{saving}%</span><span className="hidden sm:inline">Save {saving}%</span>
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-3 sm:p-4">
        <div>
          {product.industry && (
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.08em] text-accent-deep sm:text-label sm:font-medium sm:tracking-[0.06em] sm:text-ink-faint">{product.industry.name}</p>
          )}
          <h3 className="mt-0.5 line-clamp-2 min-h-[2.4rem] font-display text-[13px] font-semibold leading-[1.2] text-ink sm:mt-1 sm:min-h-0 sm:text-base sm:leading-snug">
            {/* Stretched link: the whole card is clickable, but the chips
                below sit above it in the stacking order and stay separately
                clickable. */}
            <Link
              href={`/product/${product.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {product.title}
            </Link>
          </h3>
          <p className="mt-1.5 hidden line-clamp-2 text-sm leading-relaxed text-ink-soft sm:block">
            {product.shortDescription}
          </p>
        </div>

        {chips.length > 0 && (
          <div className="relative z-10 hidden flex-wrap gap-1 sm:flex">
            {chips.map((tech) => (
              <Link
                key={tech._id}
                href={`/technology/${tech.slug}`}
                className="chip-link"
              >
                {tech.name}
              </Link>
            ))}
            {overflow > 0 && (
              <span className="chip border-dashed">+{overflow}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex min-w-0 flex-wrap items-baseline gap-x-1.5 border-t border-rule-soft pt-2 sm:gap-2 sm:pt-3">
          <span className="tabular text-[15px] font-bold text-ink sm:text-lg sm:font-medium">
            {formatPrice(product.effectivePrice)}
          </span>
          {saving !== null && (
            <span className="tabular text-[10px] text-ink-faint line-through sm:text-sm">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
