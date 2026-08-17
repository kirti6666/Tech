import { Quote, Star } from "lucide-react";

export interface PublicTestimonial {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
  rating: number;
  comment: string;
}

export function SampleTestimonials({ testimonials, compact = false }: { testimonials: PublicTestimonial[]; compact?: boolean }) {
  if (!testimonials.length) return null;

  return (
    <div className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
      {testimonials.map((item) => (
        <article key={item._id} className={`relative min-w-[17rem] snap-start overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 shadow-card sm:min-w-0 ${compact ? "p-4" : "p-5 sm:p-6"}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-200">Sample testimonial</span>
            <Quote className="h-5 w-5 text-blue-200" aria-hidden="true" />
          </div>
          <div className="mt-4 flex gap-0.5 text-amber-500" aria-label={`${item.rating} out of 5 stars`}>
            {[1,2,3,4,5].map((star) => <Star key={star} className={`h-4 w-4 ${star <= item.rating ? "fill-current" : "text-slate-200"}`} />)}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">“{item.comment}”</p>
          <div className="mt-5 flex items-center gap-3 border-t border-blue-100 pt-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#edf3fa] text-xs font-extrabold text-[#0d2f64] ring-1 ring-blue-100">
              {item.avatar ? <img src={item.avatar} alt={`${item.name} profile`} className="h-full w-full object-cover" /> : item.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0"><p className="truncate font-display text-base font-extrabold text-ink">{item.name}</p>
            {item.role && <p className="mt-0.5 truncate text-xs text-ink-faint">{item.role}</p>}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
