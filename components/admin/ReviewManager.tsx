"use client";

import { useState } from "react";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";

interface ProductOption { _id: string; title: string; slug: string }
interface SampleReview {
  _id: string;
  scope: "home" | "product";
  product?: ProductOption | string;
  name: string;
  avatar?: string;
  role?: string;
  rating: number;
  comment: string;
  status: "published" | "hidden";
  displayOrder: number;
}
interface VerifiedReview {
  _id: string;
  rating: number;
  comment: string;
  avatar?: string;
  status: "published" | "hidden";
  createdAt: string;
  user?: { name?: string; email?: string; avatar?: string };
  product?: ProductOption;
}
interface SampleDraft {
  scope: "home" | "product";
  product: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  comment: string;
  status: "published" | "hidden";
  displayOrder: number;
}

const EMPTY: SampleDraft = { scope: "home", product: "", name: "", avatar: "", role: "", rating: 5, comment: "", status: "published", displayOrder: 0 };

export function ReviewManager({ initialSamples, verifiedReviews, products }: { initialSamples: SampleReview[]; verifiedReviews: VerifiedReview[]; products: ProductOption[] }) {
  const [samples, setSamples] = useState(initialSamples);
  const [verified, setVerified] = useState(verifiedReviews);
  const [draft, setDraft] = useState<SampleDraft>(EMPTY);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reloadSamples() {
    const response = await fetch("/api/admin/testimonials");
    if (response.ok) setSamples((await response.json()).testimonials);
  }

  async function createSample() {
    setBusy("new"); setMessage(null);
    const response = await fetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error ?? "Could not add testimonial.");
    else { setDraft(EMPTY); await reloadSamples(); setMessage("Sample testimonial added."); }
    setBusy(null);
  }

  function patchLocal(id: string, patch: Partial<SampleReview>) {
    setSamples((items) => items.map((item) => item._id === id ? { ...item, ...patch } : item));
  }

  async function saveSample(item: SampleReview) {
    setBusy(item._id); setMessage(null);
    const product = typeof item.product === "string" ? item.product : item.product?._id;
    const response = await fetch(`/api/admin/testimonials/${item._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, product }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error ?? "Could not save testimonial.");
    else { await reloadSamples(); setMessage("Changes saved."); }
    setBusy(null);
  }

  async function deleteSample(id: string) {
    if (!window.confirm("Delete this sample testimonial?")) return;
    setBusy(id); setMessage(null);
    const response = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (response.ok) setSamples((items) => items.filter((item) => item._id !== id));
    else setMessage((await response.json()).error ?? "Could not delete testimonial.");
    setBusy(null);
  }

  async function moderateVerified(id: string, status?: "published" | "hidden", remove = false) {
    if (remove && !window.confirm("Permanently delete this verified review?")) return;
    setBusy(id); setMessage(null);
    const response = await fetch(`/api/admin/reviews/${id}`, remove ? { method: "DELETE" } : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) setVerified((items) => remove ? items.filter((item) => item._id !== id) : items.map((item) => item._id === id ? { ...item, status: status! } : item));
    else setMessage((await response.json()).error ?? "Could not update review.");
    setBusy(null);
  }

  async function saveVerifiedAvatar(id: string, avatar: string) {
    setVerified((items) => items.map((item) => item._id === id ? { ...item, avatar } : item));
    setBusy(id); setMessage(null);
    const response = await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar }) });
    if (!response.ok) setMessage((await response.json()).error ?? "Could not update reviewer image.");
    else setMessage("Reviewer image saved.");
    setBusy(null);
  }

  return (
    <div className="space-y-8">
      {message && <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-accent-deep">{message}</p>}

      <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="label-muted">Marketing examples</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">Add a sample testimonial</h2></div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">Always shown as “Sample”</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block"><span className="label-muted">Placement</span><select className="field mt-1.5" value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value as "home" | "product" })}><option value="home">Homepage</option><option value="product">Product page</option></select></label>
          {draft.scope === "product" && <label className="block sm:col-span-2"><span className="label-muted">Product</span><select className="field mt-1.5" value={draft.product} onChange={(e) => setDraft({ ...draft, product: e.target.value })}><option value="">Choose product</option>{products.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}</select></label>}
          <label className="block"><span className="label-muted">Display name</span><input className="field mt-1.5" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="block"><span className="label-muted">Role / business</span><input className="field mt-1.5" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></label>
          <div className="sm:col-span-2"><SingleImageUpload value={draft.avatar} onChange={(avatar) => setDraft({ ...draft, avatar })} label="Reviewer image" hint="Optional. A circular initials placeholder is used when no image is added." /></div>
          <label className="block"><span className="label-muted">Stars</span><select className="field mt-1.5" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}>{[5,4,3,2,1].map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="block"><span className="label-muted">Order</span><input type="number" className="field mt-1.5" value={draft.displayOrder} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) })} /></label>
          <label className="block sm:col-span-2 lg:col-span-4"><span className="label-muted">Sample review</span><textarea className="field mt-1.5 min-h-24" value={draft.comment} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} /></label>
        </div>
        <button type="button" onClick={createSample} disabled={busy === "new"} className="btn-primary mt-4">{busy === "new" ? "Adding…" : "Add sample testimonial"}</button>
      </section>

      <section>
        <div><p className="label-muted">Editable examples</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">Sample testimonials</h2></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {samples.map((item) => {
            const productId = typeof item.product === "string" ? item.product : item.product?._id ?? "";
            return <article key={item._id} className="rounded-2xl bg-white p-5 shadow-card">
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="label-muted">Placement</span><select className="field mt-1" value={item.scope} onChange={(e) => patchLocal(item._id, { scope: e.target.value as "home" | "product" })}><option value="home">Homepage</option><option value="product">Product page</option></select></label>
                {item.scope === "product" && <label><span className="label-muted">Product</span><select className="field mt-1" value={productId} onChange={(e) => patchLocal(item._id, { product: e.target.value })}>{products.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}</select></label>}
                <label><span className="label-muted">Name</span><input className="field mt-1" value={item.name} onChange={(e) => patchLocal(item._id, { name: e.target.value })} /></label>
                <label><span className="label-muted">Role</span><input className="field mt-1" value={item.role ?? ""} onChange={(e) => patchLocal(item._id, { role: e.target.value })} /></label>
                <div className="sm:col-span-2"><SingleImageUpload value={item.avatar ?? ""} onChange={(avatar) => patchLocal(item._id, { avatar })} label="Reviewer image" /></div>
                <label><span className="label-muted">Stars</span><select className="field mt-1" value={item.rating} onChange={(e) => patchLocal(item._id, { rating: Number(e.target.value) })}>{[5,4,3,2,1].map((n) => <option key={n}>{n}</option>)}</select></label>
                <label><span className="label-muted">Visibility</span><select className="field mt-1" value={item.status} onChange={(e) => patchLocal(item._id, { status: e.target.value as "published" | "hidden" })}><option value="published">Published</option><option value="hidden">Hidden</option></select></label>
                <label className="sm:col-span-2"><span className="label-muted">Review</span><textarea className="field mt-1 min-h-24" value={item.comment} onChange={(e) => patchLocal(item._id, { comment: e.target.value })} /></label>
              </div>
              <div className="mt-4 flex gap-2"><button type="button" onClick={() => saveSample(item)} disabled={busy === item._id} className="btn-primary">Save</button><button type="button" onClick={() => deleteSample(item._id)} disabled={busy === item._id} className="btn-secondary text-red-700">Delete</button></div>
            </article>;
          })}
          {!samples.length && <p className="rounded-xl border border-dashed border-rule bg-white p-6 text-sm text-ink-soft">No sample testimonials yet.</p>}
        </div>
      </section>

      <section>
        <div><p className="label-muted">Customer feedback</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">Verified buyer reviews</h2><p className="mt-1 text-sm text-ink-soft">Customer wording is immutable. You can publish, hide or delete a review.</p></div>
        <div className="mt-4 space-y-3">
          {verified.map((item) => <article key={item._id} className="rounded-xl bg-white p-5 shadow-card"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold text-ink">{item.user?.name ?? item.user?.email ?? "Customer"} · {item.product?.title ?? "Product"}</p><p className="mt-1 text-sm text-amber-500">{"★".repeat(item.rating)}{"☆".repeat(5-item.rating)}</p></div><span className="chip-neutral">{item.status}</span></div><p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.comment || "Rated this product."}</p><div className="mt-4"><SingleImageUpload value={item.avatar ?? item.user?.avatar ?? ""} onChange={(avatar) => saveVerifiedAvatar(item._id, avatar)} label="Reviewer image" hint="Uses the customer's profile image by default. Uploading here creates an override for this review." /></div><div className="mt-4 flex gap-2"><button type="button" className="btn-secondary" disabled={busy === item._id} onClick={() => moderateVerified(item._id, item.status === "published" ? "hidden" : "published")}>{item.status === "published" ? "Hide" : "Publish"}</button><button type="button" className="btn-secondary text-red-700" disabled={busy === item._id} onClick={() => moderateVerified(item._id, undefined, true)}>Delete</button></div></article>)}
          {!verified.length && <p className="rounded-xl border border-dashed border-rule bg-white p-6 text-sm text-ink-soft">No verified reviews yet.</p>}
        </div>
      </section>
    </div>
  );
}
