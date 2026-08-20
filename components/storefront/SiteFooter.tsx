import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";
import { BrandWordmark } from "@/components/BrandWordmark";
import { getSiteSettings } from "@/lib/site-settings";

const GROUPS = [
  { title: "Products", links: [
    { href: "/shop", label: "All products" },
    { href: "/freebies", label: "Free resources" },
    { href: "/#best-sellers-heading", label: "Best sellers" },
    { href: "/#industries-heading", label: "Browse by industry" },
    { href: "/contact?type=custom", label: "Custom development" },
  ] },
  { title: "Company", links: [
    { href: "/about", label: "About TechBro" },
    { href: "/careers", label: "Careers & sell with us" },
    { href: "/partner-program", label: "Register as a partner" },
    { href: "/blog", label: "Blog" },
    { href: "/book-consultation", label: "Book a call" },
    { href: "/contact", label: "Contact" },
  ] },
  { title: "Support", links: [
    { href: "/faq", label: "FAQ" },
    { href: "/licence", label: "Licence" },
    { href: "/refund-policy", label: "Refunds" },
    { href: "/account/purchases", label: "Your purchases" },
  ] },
  { title: "Legal", links: [
    { href: "/terms", label: "Terms of service" },
    { href: "/privacy", label: "Privacy policy" },
    { href: "/refund-policy", label: "Refund policy" },
  ] },
];

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const socialLinks = [
    { href: settings.social.instagram, label: "Instagram", Icon: Instagram },
    { href: settings.social.facebook, label: "Facebook", Icon: Facebook },
    { href: settings.social.linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((item) => item.href.trim());

  return (
    <footer className="mt-0 border-t border-white/10 bg-[#061122] text-white">
      <div className="mx-auto max-w-shell px-4 py-5 sm:px-6 sm:py-10">
        <div className="grid grid-cols-2 gap-x-5 gap-y-5 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))] lg:gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" aria-label="TechBro home" className="inline-flex"><BrandWordmark tone="inverse" tagline className="items-start" /></Link>
            <p className="mt-2 max-w-sm text-xs leading-5 text-white/65 sm:mt-3 sm:text-sm sm:leading-6">Ready-made software with complete source-code ownership.</p>
            <div className="mt-3 flex gap-2 sm:mt-4">
              <a href={`mailto:${settings.contact.email || "hello@techbro.in"}`} aria-label="Email TechBro" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-blue-300 transition hover:border-blue-400/60 hover:bg-blue-400/10 hover:text-white"><Mail size={16} /></a>
              <a href="https://wa.me/919356372353" target="_blank" rel="noopener noreferrer" aria-label="Message TechBro on WhatsApp" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300"><MessageCircle size={16} /></a>
              {socialLinks.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-0.5 hover:border-blue-400/60 hover:bg-blue-400/10 hover:text-white">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white">{group.title}</h2>
              <ul className="mt-2.5 space-y-1.5 sm:mt-4 sm:space-y-3">
                {group.links.map((link) => <li key={`${group.title}-${link.href}-${link.label}`}><Link href={link.href} className="text-xs leading-tight text-white/60 transition hover:text-white sm:text-sm">{link.label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-3 text-[10px] text-slate-500 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-5 sm:text-xs">
          <p>© {new Date().getFullYear()} TechBro. All rights reserved.</p>
          <div className="hidden flex-wrap gap-x-5 gap-y-2 sm:flex"><span>Source-code ownership</span><span>Secure checkout</span><span>India-first support</span></div>
        </div>
      </div>
    </footer>
  );
}
