import Link from "next/link";
import { getServerUser } from "@/lib/middleware/getServerUser";
import { getSiteSettings } from "@/lib/site-settings";
import { CartLink } from "./CartLink";
import { LogoutButton } from "./LogoutButton";
import { BrandWordmark } from "@/components/BrandWordmark";
import { MobileNavigation } from "./MobileNavigation";
import { ResourcesMenu } from "./ResourcesMenu";

const primaryLinks: { href: string; label: string; highlight?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/book-consultation#book-appointment", label: "Book an appointment" },
];

const mobileLinks = primaryLinks;

export async function Header() {
  const [user, settings] = await Promise.all([getServerUser(), getSiteSettings()]);
  const { brand } = settings;

  const accountHref = user?.role === "admin" ? "/admin" : "/account";
  const accountLabel = user?.role === "admin" ? "Admin" : "My Account";

  return (
    <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/95 shadow-[0_8px_28px_rgba(15,42,85,0.08)] backdrop-blur-2xl">
      <div className="mx-auto grid h-16 max-w-shell grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center px-3 sm:px-5 lg:flex lg:justify-between lg:px-6">
        <MobileNavigation links={mobileLinks} isAuthenticated={Boolean(user)} accountHref={accountHref} accountLabel={accountLabel} social={settings.social} />

        <Link href="/" className="group truncate text-center lg:hidden" aria-label={`${brand.storeName} home`}>
          <BrandWordmark name={brand.storeName} tagline />
        </Link>

        <div className="justify-self-end lg:hidden">
          <CartLink variant="icon" />
        </div>

        <Link href="/" className="logotype hidden items-center gap-2 lg:flex" aria-label={`${brand.storeName} home`}>
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.storeName} className="h-8 w-auto object-contain" />
          ) : (
            <>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-extrabold text-white shadow-accent">T</span>
              <BrandWordmark name={brand.storeName} tagline />
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-3 text-[12px] font-semibold text-ink-soft lg:flex xl:gap-5 xl:text-sm" aria-label="Main navigation">
          {primaryLinks.slice(0, 2).map((link) => (
            <Link key={link.href} href={link.href} className={link.highlight ? "rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-accent-deep" : "py-2"}>
              {link.href.includes("#book-appointment") ? <><span className="xl:hidden">Appointment</span><span className="hidden xl:inline">{link.label}</span></> : link.label}
            </Link>
          ))}
          <ResourcesMenu />
          {primaryLinks.slice(2).map((link) => (
            <Link key={link.href} href={link.href} className="py-2">
              <span className="xl:hidden">Appointment</span><span className="hidden xl:inline">{link.label}</span>
            </Link>
          ))}
          <CartLink variant="icon" />
          {user ? (
            <>
              <Link href={accountHref}>{accountLabel}</Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-accent px-3.5 py-2 font-extrabold text-white shadow-accent xl:px-4">
              Login
            </Link>
          )}
        </nav>

      </div>
    </header>
  );
}
