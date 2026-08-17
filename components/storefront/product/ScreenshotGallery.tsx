"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

/**
 * Screenshot gallery.
 *
 * These are the only real evidence a buyer has that the product exists and
 * looks finished, so they get the largest element on the page. Images are
 * shown at 16:10 and top-anchored — admin dashboards put their identity in
 * the top bar and a centred crop throws it away.
 *
 * Thumbnails are buttons in a roving list rather than a carousel: buyers
 * compare screenshots back and forth, and auto-advancing away from the one
 * someone is reading is worse than no motion at all.
 */
export function ScreenshotGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[16/10] flex-col items-center justify-center overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 text-center">
        <div className="absolute inset-x-0 top-0 flex h-9 items-center gap-1.5 border-b border-blue-100 bg-white/80 px-4">
          <span className="h-2 w-2 rounded-full bg-red-300" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-300" />
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700 shadow-sm"><Images className="h-7 w-7" aria-hidden="true" /></span>
        <strong className="mt-4 font-display text-lg text-ink sm:text-xl">Product screenshots coming soon</strong>
        <span className="mt-2 max-w-md text-xs leading-relaxed text-ink-faint sm:text-sm">Interface previews will appear here as soon as they are added from the admin panel.</span>
        <div className="mt-5 flex gap-2" aria-hidden="true"><span className="h-1.5 w-8 rounded-full bg-blue-600" /><span className="h-1.5 w-3 rounded-full bg-blue-200" /><span className="h-1.5 w-3 rounded-full bg-blue-200" /></div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="group relative overflow-hidden rounded-xl bg-slate-100"
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null || images.length < 2) return;
          const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          if (Math.abs(distance) > 45) setActive((value) => distance < 0 ? (value + 1) % images.length : (value - 1 + images.length) % images.length);
          touchStart.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={`${title} — screenshot ${active + 1} of ${images.length}`}
          className="aspect-[16/10] w-full object-contain object-center"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#061a3a]/85 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur">
          <Images className="h-3.5 w-3.5" aria-hidden="true" /> {active + 1} / {images.length}
        </div>
        {images.length > 1 && <>
          <button type="button" onClick={() => setActive((active - 1 + images.length) % images.length)} aria-label="Previous screenshot" className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-md ring-1 ring-black/5 transition hover:scale-105 sm:left-3 sm:h-10 sm:w-10"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => setActive((active + 1) % images.length)} aria-label="Next screenshot" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-md ring-1 ring-black/5 transition hover:scale-105 sm:right-3 sm:h-10 sm:w-10"><ChevronRight className="h-5 w-5" /></button>
        </>}
      </div>

      {images.length > 1 && (
        <ul className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1 sm:mt-3">
          {images.map((image, index) => (
            <li key={`${image}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show screenshot ${index + 1}`}
                aria-current={index === active}
                className={`block h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-24 ${
                  index === active
                    ? "border-accent shadow-sm"
                    : "border-transparent opacity-70 hover:border-blue-200 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
