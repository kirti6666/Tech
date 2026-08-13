"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";

export interface PublicReview {
  _id: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  user: { name: string } | null;
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} className={star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-rule"} />
      ))}
    </span>
  );
}

export function ReviewSection({ productId, reviews, average, signedIn, canReview }: {
  productId: string;
  reviews: PublicReview[];
  average: number;
  signedIn: boolean;
  canReview: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: productId, rating, comment }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(data.error ?? "Could not save your review.");
    setMessage("Your review is live. Thank you.");
    setComment("");
    router.refresh();
  }

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-rule pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-muted">Customer feedback</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">Verified product reviews</h2>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-paper-alt px-4 py-3">
          <span className="text-3xl font-bold text-ink">{reviews.length ? average.toFixed(1) : "—"}</span>
          <span><Stars value={average} /><span className="block text-xs text-ink-faint">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span></span>
        </div>
      </div>

      {reviews.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-xl border border-rule bg-white p-5">
              <div className="flex items-center justify-between gap-3"><Stars value={review.rating} /><time className="text-xs text-ink-faint">{new Date(review.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</time></div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{review.comment || "Rated this product."}</p>
              <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-ink">{review.user?.name ?? "Customer"}{review.verifiedPurchase && <><BadgeCheck size={15} className="text-save" /><span className="text-save">Verified buyer</span></>}</p>
            </article>
          ))}
        </div>
      ) : <p className="mt-6 rounded-xl border border-dashed border-rule p-6 text-sm text-ink-soft">No reviews yet. Reviews appear only from verified buyers.</p>}

      <div className="mt-6 rounded-xl bg-ink p-5 text-white sm:p-6">
        {canReview ? <>
          <h3 className="font-display text-xl font-bold">Share your experience</h3>
          <div className="mt-3 flex gap-1">{[1,2,3,4,5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} aria-label={`Rate ${star} stars`}><Star className={star <= rating ? "fill-amber-400 text-amber-400" : "text-white/30"} /></button>)}</div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} placeholder="What did you build with this product?" className="mt-3 min-h-24 w-full rounded-lg border border-white/20 bg-white/10 p-3 text-sm text-white placeholder:text-white/50" />
          <button type="button" disabled={busy} onClick={submit} className="mt-3 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-60">{busy ? "Saving…" : "Publish review"}</button>
          {message && <p className="mt-2 text-sm text-white/80">{message}</p>}
        </> : <p className="text-sm text-white/80">{signedIn ? "Purchase this product to leave a verified review." : <><Link href="/login" className="font-bold text-white underline">Sign in</Link> after purchase to share a verified review.</>}</p>}
      </div>
    </section>
  );
}
