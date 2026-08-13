import Link from "next/link";
import { buildCatalogueUrl, type CatalogueParams } from "@/lib/catalogue";

/**
 * Real <a> links, not buttons. Page 2 of a category has to be crawlable and
 * openable in a new tab — that is the entire reason the catalogue is server
 * rendered in the first place.
 *
 * Window of five around the current page, with first/last always reachable.
 */
export function Pagination({
  basePath,
  params,
  totalPages,
}: {
  basePath: string;
  params: CatalogueParams;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const current = Math.min(params.page, totalPages);
  const window = 2;
  const pages: (number | "gap")[] = [];

  for (let page = 1; page <= totalPages; page++) {
    const nearCurrent = Math.abs(page - current) <= window;
    const isEdge = page === 1 || page === totalPages;
    if (nearCurrent || isEdge) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      {current > 1 && (
        <Link
          href={buildCatalogueUrl(basePath, params, { page: current - 1 })}
          rel="prev"
          className="border border-rule px-3 py-1.5 text-label font-medium uppercase tracking-[0.06em] text-ink hover:border-accent-deep hover:text-accent-deep"
        >
          Prev
        </Link>
      )}

      {pages.map((page, index) =>
        page === "gap" ? (
          <span key={`gap-${index}`} className="px-2 text-ink-faint" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildCatalogueUrl(basePath, params, { page })}
            aria-current={page === current ? "page" : undefined}
            className={`min-w-[2.25rem] border px-2 py-1.5 text-center tabular text-sm tabular ${
              page === current
                ? "bg-accent-deep text-white ring-accent-deep"
                : "border-rule text-ink hover:border-accent-deep hover:text-accent-deep"
            }`}
          >
            {page}
          </Link>
        )
      )}

      {current < totalPages && (
        <Link
          href={buildCatalogueUrl(basePath, params, { page: current + 1 })}
          rel="next"
          className="border border-rule px-3 py-1.5 text-label font-medium uppercase tracking-[0.06em] text-ink hover:border-accent-deep hover:text-accent-deep"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
