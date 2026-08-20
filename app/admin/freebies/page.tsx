import Link from "next/link";
import { connectDB } from "@/lib/db";
import FreeResource from "@/models/FreeResource";
import { FreeResourceActions } from "@/components/admin/FreeResourceActions";

export const dynamic = "force-dynamic";

export default async function AdminFreebiesPage() {
  await connectDB();
  const docs = await FreeResource.find({}).sort({ updatedAt: -1 }).lean();
  const resources = JSON.parse(JSON.stringify(docs)) as { _id: string; title: string; slug: string; category: string; status: "draft" | "published"; downloadCount: number }[];
  return <div><header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="label">Content library</p><h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">Free resources</h1><p className="mt-2 text-sm text-ink-faint">Manage every card and its full public detail page.</p></div><Link href="/admin/freebies/new" className="btn-primary">New free resource</Link></header><div className="card overflow-x-auto"><table className="min-w-[42rem] w-full text-sm"><thead><tr className="bg-paper-alt text-left"><th className="px-5 py-3 label-muted">Resource</th><th className="px-5 py-3 label-muted">Status</th><th className="px-5 py-3 text-right label-muted">Downloads</th><th className="px-5 py-3 text-right label-muted">Actions</th></tr></thead><tbody>{resources.map((resource) => <tr key={resource._id} className="border-t border-rule-soft"><td className="px-5 py-3"><Link href={`/admin/freebies/${resource._id}`} className="font-medium text-ink hover:text-accent-deep">{resource.title}</Link><p className="mt-0.5 text-xs text-ink-faint">{resource.category} · /freebies/{resource.slug}</p></td><td className="px-5 py-3"><span className={resource.status === "published" ? "chip" : "chip-neutral"}>{resource.status === "published" ? "Live" : "Draft"}</span></td><td className="px-5 py-3 text-right tabular text-ink-soft">{resource.downloadCount.toLocaleString("en-IN")}</td><td className="px-5 py-3"><FreeResourceActions id={resource._id} title={resource.title} /></td></tr>)}</tbody></table>{resources.length === 0 && <p className="px-5 py-12 text-center text-sm text-ink-faint">No resources yet. Create the first one.</p>}</div></div>;
}
