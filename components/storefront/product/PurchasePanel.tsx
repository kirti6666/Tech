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
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-ink">Choose your package</h2>
          <span className="rounded-full bg-save/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-save">
            One-time
          </span>
        </div>

        <div className="space-y-3" role="radiogroup" aria-label="Product packages">
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
                className={`relative w-full rounded-xl border p-4 text-left transition ${
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
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${active ? "border-[5px] border-accent" : "border-ink-faint"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block text-sm font-bold text-ink">{item.name}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{item.description}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="block text-xs text-ink-faint line-through">{formatPrice(item.originalPrice)}</span>
                        )}
                        <span className="block text-lg font-bold text-save">{formatPrice(item.price)}</span>
                      </span>
                    </span>
                    <span className="mt-3 flex flex-wrap gap-1.5">
                      {item.platforms.map((platform) => {
                        const Icon = /ai/i.test(platform) ? Sparkles : /android|ios|mobile/i.test(platform) ? Smartphone : Globe2;
                        return (
                          <span key={platform} className="inline-flex items-center gap-1 rounded-md border border-rule bg-white px-2 py-1 text-[11px] font-semibold text-ink-soft">
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

        <div className="mt-5 space-y-2.5">
          <button type="button" onClick={() => putInCart(true)} className="btn-primary w-full py-3.5 text-base">
            Buy now — {formatPrice(selected.price)}
          </button>
          <button type="button" onClick={() => putInCart(false)} className="btn-secondary w-full py-3">
            {added ? "Package added to cart" : "Add to cart"}
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-faint">Plus GST. Secure checkout and GST invoice included.</p>
      </div>

      <div className="border-t border-rule bg-paper-alt/60 p-5 sm:p-6">
        <p className="label-muted mb-3">Included in this package</p>
        <ul className="space-y-2 text-sm text-ink-soft">
          {(selected.features.length ? selected.features : included).slice(0, 6).map((item) => (
            <li key={item} className="flex gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-save" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
