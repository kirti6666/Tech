import Link from "next/link";
import { Menu } from "lucide-react";
import { getServerUser } from "@/lib/middleware/getServerUser";
import { getSiteSettings } from "@/lib/site-settings";
import { CartLink } from "./CartLink";
import { LogoutButton } from "./LogoutButton";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
];

export async function Header() {
  const [user, settings] = await Promise.all([getServerUser(), getSiteSettings()]);
  const { brand } = settings;

  const accountHref = user?.role === "admin" ? "/admin" : "/account";
  const accountLabel = user?.role === "admin" ? "Admin" : "My Account";

  return (
    <header className="sticky top-0 z-40 border-b border-rule-soft bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between px-4 sm:px-6">
        <Link href="/" className="logotype flex items-center gap-2" aria-label={`${brand.storeName} home`}>
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.storeName} className="h-8 w-auto object-contain" />
          ) : (
            <>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-cta text-sm font-extrabold text-white">T</span>
              <span>{brand.storeName}</span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-ink-soft md:flex" aria-label="Main navigation">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-accent-deep">
              {link.label}
            </Link>
          ))}
          <CartLink />
          {user ? (
            <>
              <Link href={accountHref} className="transition-colors hover:text-accent-deep">{accountLabel}</Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-accent-cta px-4 py-2 text-white shadow-accent transition hover:brightness-105">
              Login
            </Link>
          )}
        </nav>

        <details className="group relative md:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg text-ink transition hover:bg-accent-mist [&::-webkit-details-marker]:hidden" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </summary>
          <nav className="absolute right-0 top-12 w-56 rounded-xl bg-white p-2 shadow-lift ring-1 ring-rule" aria-label="Mobile navigation">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-lg px-4 py-3 text-sm font-semibold text-ink hover:bg-accent-mist">
                {link.label}
              </Link>
            ))}
            <div className="rounded-lg px-4 py-3 text-sm font-semibold text-ink hover:bg-accent-mist"><CartLink /></div>
            {user ? (
              <>
                <Link href={accountHref} className="block rounded-lg px-4 py-3 text-sm font-semibold text-ink hover:bg-accent-mist">{accountLabel}</Link>
                <div className="px-4 py-2"><LogoutButton /></div>
              </>
            ) : (
              <Link href="/login" className="mt-1 block rounded-lg bg-accent-cta px-4 py-3 text-center text-sm font-semibold text-white">Login</Link>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
