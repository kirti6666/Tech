type BrandWordmarkProps = {
  name?: string;
  tone?: "default" | "inverse";
  tagline?: boolean;
  className?: string;
};

/**
 * Editorial brand wordmark inspired by high-contrast luxury identities.
 * It stays as real text for accessibility, sharp rendering and easy admin
 * branding changes rather than baking the store name into an image.
 */
export function BrandWordmark({
  name = "TechBro",
  tone = "default",
  tagline = false,
  className = "",
}: BrandWordmarkProps) {
  const isTechBro = name.replace(/\s+/g, "").toLowerCase() === "techbro";
  const gradient =
    tone === "inverse"
      ? "from-white via-[#dbeafe] to-[#60a5fa]"
      : "from-[#06152f] via-[#123b78] to-[#2563eb]";

  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className={`relative inline-flex items-baseline bg-gradient-to-r ${gradient} bg-clip-text font-brand text-[1.75rem] font-black tracking-[-0.07em] text-transparent`}>
        {isTechBro ? (
          <>
            <span className="relative z-10">Tech</span>
            <span className="relative z-10 -ml-[0.015em] pr-[0.08em] font-black italic">
              Bro
              <span
                className={`absolute -bottom-[0.05em] left-[0.08em] h-[0.16em] w-[1.05em] -rotate-3 rounded-[100%] border-b ${tone === "inverse" ? "border-blue-400/80" : "border-blue-500/70"}`}
                aria-hidden="true"
              />
            </span>
          </>
        ) : (
          <span className="pr-[0.08em]">{name}</span>
        )}
      </span>
      {tagline && (
        <span className={`mt-1 font-sans text-[0.42rem] font-bold uppercase tracking-[0.28em] ${tone === "inverse" ? "text-white/55" : "text-ink-faint"}`}>
          Digital Products
        </span>
      )}
    </span>
  );
}
