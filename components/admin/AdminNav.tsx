"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar navigation with a current-section indicator.
 *
 * Split out as a client component purely so it can read the pathname. The
 * match is prefix-based below the root, so /admin/products/64f… still
 * highlights Products — an operator three levels into an edit screen should
 * still see where they are.
 *
 * `/admin` is matched exactly, otherwise the dashboard would light up on
 * every page.
 */

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/freebies", label: "Free resources" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/taxonomy", label: "Industries & tech" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/services", label: "Service queue" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/career-submissions", label: "Career submissions" },
  { href: "/admin/partners", label: "Partner registrations" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({
  counts,
  mobile = false,
}: {
  counts?: Record<string, number>;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className={mobile ? "mt-3 flex gap-1 overflow-x-auto pb-1" : "mt-6 space-y-0.5"}>
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        const badge = counts?.[item.href];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-paper text-accent-deep shadow-card"
                : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}
          >
            {item.label}
            {badge ? (
              <span className="rounded-md bg-accent-wash px-1.5 py-0.5 text-xs font-medium text-accent-deep tabular">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
