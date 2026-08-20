"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";
export function BlogPostActions({ id, title }: { id: string; title: string }) { const router = useRouter(); const [deleting, setDeleting] = useState(false); async function remove() { if (!window.confirm(`Delete “${title}”?`)) return; setDeleting(true); const response = await adminFetch(`/api/admin/blog/${id}`, { method: "DELETE" }); if (!response.ok) { window.alert((await response.json().catch(() => ({}))).error || "Could not delete article"); setDeleting(false); return; } router.refresh(); } return <div className="flex justify-end gap-2"><Link href={`/admin/blog/${id}`} aria-label={`Edit ${title}`} className="grid h-9 w-9 place-items-center rounded-lg border border-rule text-accent-deep hover:bg-accent-wash"><Pencil size={15} /></Link><button type="button" onClick={remove} disabled={deleting} aria-label={`Delete ${title}`} className="grid h-9 w-9 place-items-center rounded-lg border border-red-100 text-red-700 hover:bg-red-50"><Trash2 size={15} /></button></div>; }
