"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";

export function CartLink() {
  // Avoids a hydration mismatch: the persisted cart only exists in the
  // browser, so the item count is 0 on the server-rendered HTML and only
  // becomes accurate after the client mounts and reads localStorage.
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);

  useEffect(() => setMounted(true), []);

  // Digital licences have no quantity — a product is in the cart or it
  // isn't, so the count is simply the number of lines.
  const count = mounted ? items.length : 0;

  return (
    <Link href="/cart" className="hover:underline">
      Cart{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
