export function TrustedCompaniesMarquee({ companies }: { companies: string[] }) {
  const names = companies.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-b border-rule bg-gradient-to-b from-white to-accent-mist/60 py-5 sm:py-11" aria-labelledby="trusted-companies-heading">
      <div className="pointer-events-none absolute left-1/2 top-0 h-20 w-64 -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl sm:h-28 sm:w-80" />
      <div className="mx-auto max-w-shell">
        <div className="relative flex items-center justify-center gap-2 px-4 sm:gap-5">
          <span className="h-px w-5 bg-gradient-to-r from-transparent to-blue-300 sm:w-20" aria-hidden="true" />
          <h2
            id="trusted-companies-heading"
            className="max-w-[17rem] text-center font-brand text-[1.08rem] font-black leading-[1.08] tracking-[-0.035em] text-accent-deep sm:max-w-none sm:text-[1.75rem] sm:leading-tight"
          >
            Trusted by <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text italic text-transparent">growing businesses</span> across India
          </h2>
          <span className="h-px w-5 bg-gradient-to-l from-transparent to-blue-300 sm:w-20" aria-hidden="true" />
        </div>

        <div className="trusted-marquee mt-3 overflow-hidden sm:mt-5" role="region" aria-label="Trusted companies">
          <div className="trusted-marquee-track flex w-max items-center">
            <CompanyGroup companies={names} />
            <CompanyGroup companies={names} duplicate />
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanyGroup({ companies, duplicate = false }: { companies: string[]; duplicate?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-6 pr-6 sm:gap-12 sm:pr-12" aria-hidden={duplicate || undefined}>
      {companies.map((company, index) => (
        <span
          key={`${duplicate ? "copy" : "original"}-${company}-${index}`}
          className="inline-flex items-center whitespace-nowrap font-brand text-[0.95rem] font-bold tracking-[-0.025em] text-accent/65 sm:text-xl"
        >
          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-400/55" aria-hidden="true" />
          {company}
        </span>
      ))}
    </div>
  );
}
