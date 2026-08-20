import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import FreeResource from "@/models/FreeResource";
import { FreeResourceForm, type FreeResourceDraft } from "@/components/admin/FreeResourceForm";

export const dynamic = "force-dynamic";

const BLANK: FreeResourceDraft = { title: "", slug: "", subtitle: "", category: "Business resources", description: "", coverImage: "", galleryImages: [], overview: "", highlights: [], terms: ["Free digital download", "For personal and internal business use", "No resale or redistribution"], sections: [], downloadUrl: "", downloadCount: 0, originalPrice: 0, featured: false, status: "draft" };

export default async function EditFreeResourcePage({ params }: { params: { id: string } }) {
  await connectDB();
  const isNew = params.id === "new";
  let draft = BLANK;
  if (!isNew) { const doc = await FreeResource.findById(params.id).lean(); if (!doc) notFound(); draft = { ...BLANK, ...JSON.parse(JSON.stringify(doc)), _id: params.id }; }
  return <div><header className="mb-6"><Link href="/admin/freebies" className="label text-xs hover:underline">← Free resources</Link><h1 className="mt-2 font-display text-4xl font-light tracking-tight text-ink">{isNew ? "New free resource" : draft.title}</h1></header><FreeResourceForm initial={draft} /></div>;
}
