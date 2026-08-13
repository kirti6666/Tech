"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";

export function ProductActions({ productId, productTitle, soldCount = 0, editOnly = false }: {
  productId: string;
  productTitle: string;
  soldCount?: number;
  editOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not delete this product.");
        return;
      }
      setOpen(false);
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {!editOnly && <Link href={`/admin/products/${productId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-white px-3 py-2 text-xs font-bold text-ink transition hover:border-accent hover:text-accent-deep"><Pencil size={14} /> Edit</Link>}
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"><Trash2 size={14} /> Delete</button>
      </div>

      {open && <div className="fixed inset-0 z-[70] grid place-items-center px-4" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
        <button type="button" aria-label="Cancel deleting product" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/55 backdrop-blur-sm" />
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper-alt"><X size={18} /></button>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-700"><Trash2 size={22} /></span>
          <h2 id="delete-product-title" className="mt-4 font-display text-xl font-bold text-ink">Delete this product?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft"><strong className="text-ink">{productTitle}</strong> will be permanently removed from the catalogue and admin panel.</p>
          {soldCount > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">This product has {soldCount} active {soldCount === 1 ? "licence" : "licences"}. It cannot be deleted because buyers must retain their downloads. Unpublish it instead.</p>}
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p>}
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button><button type="button" onClick={remove} disabled={busy || soldCount > 0} className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Deleting…" : "Delete permanently"}</button></div>
        </div>
      </div>}
    </>
  );
}
