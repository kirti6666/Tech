"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TECH_CATEGORIES, TECH_CATEGORY_LABELS, type TechCategory } from "@/types/catalog";

/**
 * Industries and technology tags, managed side by side.
 *
 * Two things this screen makes visible that the database doesn't:
 *
 * Slugs are shown and can't be edited after creation. /industry/fintech and
 * /technology/react are indexed URLs — renaming one throws away whatever
 * ranking it earned and 404s every link pointing at it. Showing the slug
 * greyed out is more honest than hiding the field and letting someone
 * assume the display name is all there is.
 *
 * Product counts are shown next to a delete control, so nobody removes a
 * tag that eleven live products depend on without seeing the number first.
 * The API refuses that delete anyway; this is so the refusal isn't a
 * surprise.
 */

interface Item {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
  displayOrder: number;
  isActive: boolean;
  category?: TechCategory;
}

export function TaxonomyManager({
  industries,
  technologies,
}: {
  industries: Item[];
  technologies: Item[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TaxonomyColumn
        kind="industry"
        title="Industries"
        subtitle="One per product. Each gets a landing page at /industry/[slug]."
        items={industries}
      />
      <TaxonomyColumn
        kind="technology"
        title="Technologies"
        subtitle="Many per product. Grouped by layer on the product page."
        items={technologies}
        grouped
      />
    </div>
  );
}

function TaxonomyColumn({
  kind,
  title,
  subtitle,
  items,
  grouped,
}: {
  kind: "industry" | "technology";
  title: string;
  subtitle: string;
  items: Item[];
  grouped?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TechCategory>("frontend");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/taxonomy?kind=${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "technology" ? { name, category } : { name }
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not create that.");
        return;
      }
      setName("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Item) {
    if (item.productCount > 0) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/taxonomy?kind=${kind}&id=${item._id}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) setError(data.error ?? "Could not delete that.");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: Item) {
    setBusy(true);
    try {
      await fetch(`/api/admin/taxonomy?kind=${kind}&id=${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const groups = grouped
    ? TECH_CATEGORIES.map((cat) => ({
        key: cat,
        label: TECH_CATEGORY_LABELS[cat],
        items: items.filter((i) => i.category === cat),
      })).filter((g) => g.items.length)
    : [{ key: "all", label: "", items }];

  return (
    <section className="card overflow-hidden">
      <div className="panel-head">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
        <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>
      </div>

      <div className="border-b border-rule-soft px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder={kind === "industry" ? "Fintech" : "React"}
            className="field flex-1"
          />
          {kind === "technology" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TechCategory)}
              className="field w-36"
            >
              {TECH_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {TECH_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={create}
            disabled={busy || !name.trim()}
            className="btn-primary"
          >
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>

      {groups.map((group) => (
        <div key={group.key}>
          {group.label && (
            <p className="bg-paper-alt px-5 py-1.5 text-xs uppercase tracking-[0.06em] text-ink-faint">
              {group.label}
            </p>
          )}
          <ul className="divide-y divide-rule-soft">
            {group.items.map((item) => (
              <li
                key={item._id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.isActive ? "text-ink" : "text-ink-ghost line-through"
                    }`}
                  >
                    {item.name}
                  </p>
                  <p className="font-mono text-xs text-ink-faint">
                    /{item.slug}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs tabular text-ink-faint">
                    {item.productCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    disabled={busy}
                    className="text-xs font-medium text-accent-deep hover:underline"
                  >
                    {item.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    disabled={busy || item.productCount > 0}
                    title={
                      item.productCount > 0
                        ? `${item.productCount} product(s) use this`
                        : undefined
                    }
                    className="text-xs font-medium text-red-700 hover:underline disabled:cursor-not-allowed disabled:text-ink-ghost disabled:no-underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {items.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-ink-faint">
          Nothing here yet.
        </p>
      )}
    </section>
  );
}
