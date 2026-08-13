import Link from "next/link";

/**
 * Shared shell for policy and legal pages.
 *
 * Narrow measure (~65 characters), generous leading, and a visible "last
 * updated" date. That date matters more than it looks: a refund policy with
 * no date is unenforceable in practice, because neither side can say which
 * version applied when the order was placed. Update it whenever the text
 * changes.
 */
export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:px-6">
      <header className="mb-10">
        <p className="label">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-ink-faint">Last updated {updated}</p>
        {intro && (
          <p className="mt-6 text-base leading-relaxed text-ink-soft">{intro}</p>
        )}
      </header>

      <div className="space-y-8">{children}</div>

      <footer className="mt-16 border-t border-rule pt-6">
        <p className="text-sm text-ink-soft">
          Questions about any of this?{" "}
          <Link href="/contact" className="text-accent-deep hover:underline">
            Get in touch
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}

export function Clause({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-normal text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}
