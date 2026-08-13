import Product from "@/models/Product";
import Industry from "@/models/Industry";
import Technology from "@/models/Technology";

/**
 * Recomputes the denormalised productCount on every industry and
 * technology. Call after any publish / unpublish / delete, and from a
 * nightly job as a safety net.
 *
 * Full recount rather than incremental +1/-1: the counts only drive
 * display tiles, and a full aggregate over a few hundred products costs
 * nothing, whereas incremental counters drift the first time an update
 * path forgets to call them. Cheap and self-healing beats clever here.
 */

export async function recountTaxonomy(): Promise<void> {
  const [industryCounts, techCounts] = await Promise.all([
    Product.aggregate<{ _id: unknown; count: number }>([
      { $match: { status: "published" } },
      { $group: { _id: "$industry", count: { $sum: 1 } } },
    ]),
    Product.aggregate<{ _id: unknown; count: number }>([
      { $match: { status: "published" } },
      { $unwind: "$techStack" },
      { $group: { _id: "$techStack", count: { $sum: 1 } } },
    ]),
  ]);

  await Promise.all([
    Industry.updateMany({}, { $set: { productCount: 0 } }),
    Technology.updateMany({}, { $set: { productCount: 0 } }),
  ]);

  await Promise.all([
    ...industryCounts.map((row) =>
      Industry.updateOne({ _id: row._id }, { $set: { productCount: row.count } })
    ),
    ...techCounts.map((row) =>
      Technology.updateOne({ _id: row._id }, { $set: { productCount: row.count } })
    ),
  ]);
}
