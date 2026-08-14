import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/book-consultation", label: "Book a call" },
  { href: "/faq", label: "FAQ" },
  { href: "/licence", label: "Licence" },
  { href: "/refund-policy", label: "Refunds" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-rule bg-white">
      <div className="mx-auto max-w-shell px-5 py-8 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="logotype">TechBro</Link>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-ink-faint">
              Ready-made websites, apps and business software with complete source code.
            </p>
          </div>
          <nav className="flex max-w-2xl flex-wrap gap-x-5 gap-y-3" aria-label="Footer navigation">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs font-medium text-ink-soft transition hover:text-accent-deep">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-rule-soft pt-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TechBro. All rights reserved.</p>
          <a href="mailto:hello@techbro.in" className="hover:text-accent-deep">hello@techbro.in</a>
        </div>
      </div>
    </footer>
  );
}
