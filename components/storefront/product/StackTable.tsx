import Link from "next/link";
import { TECH_CATEGORY_LABELS, TECH_CATEGORIES } from "@/types/catalog";
import type { TechCategory } from "@/types/catalog";

interface Tech {
  _id: string;
  name: string;
  slug: string;
  category: TechCategory;
}

/**
 * The signature element of the site: the stack rendered as a datasheet
 * rather than a pile of logos.
 *
 * Buyers here are technical or are forwarding the page to someone who is,
 * and the question they need answered is "can my team maintain this" — which
 * needs the layers separated. Frontend / Backend / Mobile / Database as
 * labelled rows answers it in one glance; a row of framework logos does not.
 *
 * Rows render in fixed layer order, and empty layers are omitted rather than
 * printed as "—", so a web-only product doesn't advertise a missing mobile
 * app.
 */
export function StackTable({
  techStack,
  requirements,
}: {
  techStack: Tech[];
  requirements?: { server?: string; language?: string; database?: string };
}) {
  const byCategory = new Map<TechCategory, Tech[]>();
  for (const tech of techStack) {
    byCategory.set(tech.category, [...(byCategory.get(tech.category) ?? []), tech]);
  }

  const rows = TECH_CATEGORIES.filter((category) => byCategory.get(category)?.length);

  const requirementRows = [
    { label: "Server", value: requirements?.server },
    { label: "Runtime", value: requirements?.language },
    { label: "Database", value: requirements?.database },
  ].filter((row) => row.value);

  if (rows.length === 0 && requirementRows.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-rule bg-rule-soft">
      <h2 className="bg-paper-alt px-4 py-2.5 label-muted">
        Technical specification
      </h2>

      <dl className="grid gap-px sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((category) => (
          <div
            key={category}
            className="grid min-h-12 grid-cols-[5.5rem_1fr] items-center gap-2 bg-white px-4 py-2.5"
          >
            <dt className="label-muted">{TECH_CATEGORY_LABELS[category]}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {byCategory.get(category)!.map((tech) => (
                <Link
                  key={tech._id}
                  href={`/technology/${tech.slug}`}
                  className="chip-link"
                >
                  {tech.name}
                </Link>
              ))}
            </dd>
          </div>
        ))}

        {requirementRows.map((row) => (
          <div
            key={row.label}
            className="grid min-h-12 grid-cols-[5.5rem_1fr] items-center gap-2 bg-white px-4 py-2.5"
          >
            <dt className="label-muted">{row.label}</dt>
            <dd className="tabular text-sm text-ink-soft">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
