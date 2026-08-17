"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export function CartLink({ variant = "text" }: { variant?: "text" | "icon" }) {
  // Avoids a hydration mismatch: the persisted cart only exists in the
  // browser, so the item count is 0 on the server-rendered HTML and only
  // becomes accurate after the client mounts and reads localStorage.
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);

  useEffect(() => setMounted(true), []);

  // Digital licences have no quantity — a product is in the cart or it
  // isn't, so the count is simply the number of lines.
  const count = mounted ? items.length : 0;

  if (variant === "icon") {
    return (
      <Link
        href="/cart"
        aria-label={`Shopping cart${count > 0 ? ` with ${count} item${count === 1 ? "" : "s"}` : ""}`}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-ink transition hover:bg-accent-mist hover:text-accent-deep"
      >
        <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={2.2} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-extrabold leading-none text-accent-deep ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link href="/cart" className="hover:underline">
      Cart{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
