"use client";

import { useState } from "react";

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

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-lg bg-paper-alt label-muted">
        Screenshots coming soon
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg bg-paper-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={`${title} — screenshot ${active + 1} of ${images.length}`}
          className="aspect-[16/10] w-full object-cover object-top"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show screenshot ${index + 1}`}
                aria-current={index === active}
                className={`block h-16 w-24 shrink-0 overflow-hidden border transition-colors ${
                  index === active
                    ? "border-accent-deep"
                    : "border-rule hover:border-ink-faint"
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
