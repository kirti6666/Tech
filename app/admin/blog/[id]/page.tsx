import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { BlogPostForm, type BlogPostDraft } from "@/components/admin/BlogPostForm";
const BLANK: BlogPostDraft = { title: "", slug: "", excerpt: "", category: "Business growth", coverImage: "", author: "TechBro Editorial", authorRole: "TechBro team", intro: "", sections: [{ heading: "", body: "", image: "" }], readTime: 5, publishedAt: new Date().toISOString(), featured: false, status: "draft" };
export default async function EditBlogPostPage({ params }: { params: { id: string } }) { const isNew = params.id === "new"; let draft = BLANK; if (!isNew) { await connectDB(); const doc = await BlogPost.findById(params.id).lean(); if (!doc) notFound(); draft = { ...BLANK, ...JSON.parse(JSON.stringify(doc)), _id: params.id }; } return <div><header className="mb-6"><Link href="/admin/blog" className="label text-xs hover:underline">← Blog</Link><h1 className="mt-2 font-display text-4xl font-light tracking-tight text-ink">{isNew ? "New article" : draft.title}</h1></header><BlogPostForm initial={draft} /></div>; }
