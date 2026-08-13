"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe2, Smartphone, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/price";
import { useCartStore } from "@/store/useCartStore";
import type { ProductPackage } from "@/types/catalog";

export function PurchasePanel({
  productId,
  title,
  slug,
  image,
  price,
  discountPrice,
  packages,
  included,
}: {
  productId: string;
  title: string;
  slug: string;
  image?: string;
  price: number;
  discountPrice?: number;
  packages: ProductPackage[];
  included: string[];
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const options = useMemo<ProductPackage[]>(
    () =>
      packages.length
        ? packages
        : [
            {
              id: "standard",
              name: "Complete source code",
              description: "One-time licence for the complete product",
              platforms: ["Web"],
              price: discountPrice && discountPrice < price ? discountPrice : price,
              originalPrice: discountPrice && discountPrice < price ? price : undefined,
              features: included,
              isPopular: true,
            },
          ],
    [packages, price, discountPrice, included]
  );
  const [selectedId, setSelectedId] = useState(
    options.find((item) => item.isPopular)?.id ?? options[0].id
  );
  const selected = options.find((item) => item.id === selectedId) ?? options[0];

  function putInCart(redirect = false) {
    addItem({
      productId,
      title,
      slug,
      image,
      price: selected.price,
      packageId: selected.id,
      packageName: selected.name,
    });
    setAdded(true);
    if (redirect) router.push("/checkout");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-white shadow-[0_18px_55px_rgba(31,38,78,0.12)] lg:sticky lg:top-6">
      <div className="p-3.5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <h2 className="font-display text-lg font-bold text-ink sm:text-xl">Choose your package</h2>
          <span className="rounded-full bg-save/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-save">
            One-time
          </span>
        </div>

        <div className="space-y-2 sm:space-y-3" role="radiogroup" aria-label="Product packages">
          {options.map((item) => {
            const active = selected.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setSelectedId(item.id);
                  setAdded(false);
                }}
                className={`relative w-full rounded-xl border p-3 text-left transition sm:p-4 ${
                  active
                    ? "border-accent bg-accent-mist/70 ring-2 ring-accent/20"
                    : "border-rule hover:border-accent/50"
                }`}
              >
                {item.isPopular && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-white">
                    Most popular
                  </span>
                )}
                <span className="flex items-start gap-3">
                  <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 sm:mt-1 ${active ? "border-[5px] border-accent" : "border-ink-faint"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block text-sm font-bold text-ink">{item.name}</span>
                        <span className="mt-0.5 hidden text-xs leading-relaxed text-ink-soft sm:block">{item.description}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="block text-xs text-ink-faint line-through">{formatPrice(item.originalPrice)}</span>
                        )}
                        <span className="block text-base font-bold text-save sm:text-lg">{formatPrice(item.price)}</span>
                      </span>
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
                      {item.platforms.map((platform) => {
                        const Icon = /ai/i.test(platform) ? Sparkles : /android|ios|mobile/i.test(platform) ? Smartphone : Globe2;
                        return (
                          <span key={platform} className="inline-flex items-center gap-1 rounded-md border border-rule bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft sm:px-2 sm:py-1 sm:text-[11px]">
                            <Icon size={12} /> {platform}
                          </span>
                        );
                      })}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:block sm:space-y-2.5">
          <button type="button" onClick={() => putInCart(true)} className="btn-primary w-full px-2 py-3 text-sm sm:py-3.5 sm:text-base">
            Buy now — {formatPrice(selected.price)}
          </button>
          <button type="button" onClick={() => putInCart(false)} className="btn-secondary w-full px-2 py-3 text-sm">
            {added ? "Package added to cart" : "Add to cart"}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-faint sm:mt-3 sm:text-xs">Plus GST. Secure checkout and GST invoice included.</p>
      </div>

      <div className="border-t border-rule bg-paper-alt/60 p-3.5 sm:p-6">
        <p className="label-muted mb-2 sm:mb-3">Included in this package</p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-ink-soft sm:block sm:space-y-2 sm:text-sm">
          {(selected.features.length ? selected.features : included).slice(0, 4).map((item) => (
            <li key={item} className="flex gap-2">
              <Check size={14} className="mt-0.5 shrink-0 text-save sm:h-4 sm:w-4" />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
