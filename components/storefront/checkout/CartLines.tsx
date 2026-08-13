"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/price";
import type { AddonOffer } from "@/lib/addons";
import type { CartItem } from "@/store/useCartStore";
import type { AddonType } from "@/types/catalog";

/**
 * The cart lines, each with the three services offered against that
 * product.
 *
 * Add-ons sit under the product they apply to rather than in one block at
 * the bottom, because rebranding and deployment are performed on a specific
 * product — with two products in the cart, an order-level "rebranding"
 * checkbox is ambiguous about what gets rebranded.
 *
 * Ticking a box does not compute anything locally. It updates the cart and
 * the parent re-requests a quote, so the figure on screen is always the
 * figure the server will charge.
 */
export function CartLines({
  items,
  addons,
  onToggleAddon,
  onRemove,
  busy,
}: {
  items: CartItem[];
  addons: AddonOffer[];
  onToggleAddon: (productId: string, addon: AddonType) => void;
  onRemove: (productId: string) => void;
  busy?: boolean;
}) {
  return (
    <ul className="space-y-3 sm:space-y-4">
      {items.map((item) => (
        <li key={item.productId} className="card overflow-hidden">
          <div className="flex gap-2.5 border-b border-rule-soft p-3 sm:gap-4 sm:p-5">
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt=""
                className="h-12 w-16 shrink-0 rounded-lg object-cover object-top sm:h-20 sm:w-28"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-semibold text-ink">
                <Link href={`/product/${item.slug}`} className="hover:text-accent-deep">
                  {item.title}
                </Link>
              </h3>
              <p className="mt-0.5 tabular text-sm text-ink-soft tabular">
                {formatPrice(item.price)}
              </p>
              {item.packageName && (
                <p className="mt-1 text-xs font-medium text-accent-deep">
                  {item.packageName}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.productId)}
              disabled={busy}
              className="self-start rounded-md px-2 py-1 text-xs font-medium text-ink-faint hover:bg-accent-mist hover:text-accent-deep disabled:opacity-50"
            >
              Remove
            </button>
          </div>

          {addons.length > 0 && (
            <div className="bg-paper-alt/50 p-3 sm:p-5">
              <p className="label-muted mb-2 sm:mb-2.5">Optional services</p>
              <ul className="space-y-2 sm:space-y-2.5">
                {addons.map((addon) => {
                  const checked = item.addons.includes(addon.type);
                  return (
                    <li key={addon.type}>
                      <label className="flex cursor-pointer gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={busy}
                          onChange={() => onToggleAddon(item.productId, addon.type)}
                          className="mt-1 h-3.5 w-3.5 shrink-0 accent-accent-deep"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-sm font-medium text-ink">
                              {addon.label}
                            </span>
                            <span className="tabular text-sm text-ink tabular">
                              + {formatPrice(addon.price)}
                            </span>
                          </span>
                          <span className="mt-0.5 hidden text-xs leading-relaxed text-ink-soft sm:block">
                            {addon.description}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
