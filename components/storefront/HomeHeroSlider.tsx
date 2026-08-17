"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Banner } from "@/lib/site-settings";

export const DEFAULT_HERO_BANNERS: Banner[] = [
  { image: "/images/techbro-hero-ready-made.png", heading: "Launch your business with ready-made software", subheading: "", link: "/shop" },
  { image: "/images/techbro-hero-source-code.png", heading: "Ready-to-launch products with complete source code", subheading: "", link: "/shop" },
  { image: "/images/techbro-hero-premium.png", heading: "Premium software ready for your brand", subheading: "", link: "/shop" },
];

export function HomeHeroSlider({ slides }: { slides?: Banner[] }) {
  const visibleSlides = slides?.filter((slide) => slide.image.trim()) ?? [];
  const banners = visibleSlides.length > 0 ? visibleSlides : DEFAULT_HERO_BANNERS;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % banners.length), 5000);
    return () => window.clearInterval(timer);
  }, [banners.length, paused]);

  function move(direction: number) {
    setActive((current) => (current + direction + banners.length) % banners.length);
  }

  return (
    <div
      className="group relative w-full overflow-hidden"
      role="region"
      aria-label="TechBro highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
        touchStart.current = null;
      }}
    >
      <div className="relative aspect-[3/1] w-full">
        {banners.map((slide, index) => {
          const image = (
            <Image
              src={slide.image}
              alt={slide.heading || slide.subheading || `TechBro banner ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-contain"
            />
          );
          return (
            <div key={`${slide.image}-${index}`} className={`absolute inset-0 transition-opacity duration-700 ${index === active ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={index !== active || undefined}>
              {slide.link ? <Link href={slide.link} className="absolute inset-0">{image}</Link> : image}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={() => move(-1)} aria-label="Previous banner" className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-accent-deep shadow-card ring-1 ring-black/5 transition hover:bg-white sm:grid">
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button type="button" onClick={() => move(1)} aria-label="Next banner" className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-accent-deep shadow-card ring-1 ring-black/5 transition hover:bg-white sm:grid">
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur-sm sm:bottom-3">
        {banners.map((slide, index) => (
          <button key={`${slide.image}-${index}`} type="button" onClick={() => setActive(index)} aria-label={`Show banner ${index + 1}`} aria-current={index === active ? "true" : undefined} className={`h-1.5 rounded-full transition-all sm:h-2 ${index === active ? "w-5 bg-white sm:w-6" : "w-1.5 bg-white/60 hover:bg-white sm:w-2"}`} />
        ))}
      </div>
    </div>
  );
}
