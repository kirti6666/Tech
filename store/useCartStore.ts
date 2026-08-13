"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddonType } from "@/types/catalog";

/**
 * Cart for digital licences.
 *
 * Gone from the retail version: quantity, variants, maxStock. Buying two
 * copies of the same licence is meaningless, so a product is either in the
 * cart or it isn't, and adding it twice is a no-op rather than a quantity
 * bump.
 *
 * Added: `addons` per line. Rebranding and deployment are performed on a
 * specific product, so they belong to the line rather than the order.
 *
 * `price` here is display-only. It is deliberately never sent to the server
 * — the quote endpoint re-derives every price from the database. If the
 * stored price is stale, the buyer sees the corrected total at checkout
 * before paying.
 */

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  price: number;
  image?: string;
  packageId?: string;
  packageName?: string;
  addons: AddonType[];
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "addons">) => void;
  removeItem: (productId: string) => void;
  toggleAddon: (productId: string, addon: AddonType) => void;
  has: (productId: string) => boolean;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        set({
          items: existing
            ? get().items.map((i) =>
                i.productId === item.productId ? { ...i, ...item } : i
              )
            : [...get().items, { ...item, addons: [] }],
        });
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      toggleAddon: (productId, addon) => {
        set({
          items: get().items.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  addons: item.addons.includes(addon)
                    ? item.addons.filter((a) => a !== addon)
                    : [...item.addons, addon],
                }
              : item
          ),
        });
      },

      has: (productId) => get().items.some((i) => i.productId === productId),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "techbro-cart",
      version: 3,
      // The retail cart shape (quantity/variant/maxStock) can't be migrated
      // into this one meaningfully, so a returning shopper starts empty
      // rather than with a cart that half-works.
      migrate: () => ({ items: [] }) as Partial<CartState>,
    }
  )
);

/** Shape the server expects. Ids and add-on choices only — never prices. */
export function toQuoteItems(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    packageId: item.packageId,
    addons: item.addons,
  }));
}
