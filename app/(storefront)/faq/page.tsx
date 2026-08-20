import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getPublishedFaqs } from "@/lib/faqs";

export const revalidate = 900;
export const metadata: Metadata = { title: "Frequently asked questions | TechBro", description: "Answers about TechBro products, licences, payments, delivery and support.", alternates: { canonical: "/faq" } };

export default async function FaqPage() {
  const faqs = await getPublishedFaqs();
  const groups = Array.from(new Set(faqs.map((faq) => faq.category))).map((category) => ({ category, description: faqs.find((faq) => faq.category === category)?.categoryDescription ?? "", items: faqs.filter((faq) => faq.category === category) }));
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };

  return <main className="bg-gradient-to-b from-white to-paper-alt/70">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="border-b border-rule-soft px-4 py-9 text-center sm:px-6 sm:py-12"><div className="mx-auto max-w-2xl"><p className="label">TechBro support</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">Frequently asked questions</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-soft sm:text-base">Straight answers about ownership, licences, payments, delivery and support.</p></div></section>
    <div className="mx-auto grid max-w-5xl gap-7 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <aside className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start"><div className="rounded-2xl bg-[#071a3d] p-5 text-white shadow-card"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-200">Need more help?</p><h2 className="mt-2 font-display text-xl font-extrabold">Talk to our team</h2><p className="mt-2 text-xs leading-5 text-blue-100/70">Tell us what you are planning and we’ll help you choose the right next step.</p><Link href="/contact" className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-white hover:underline">Contact TechBro <ArrowRight size={13} /></Link></div><div className="mt-3 rounded-2xl border border-rule bg-white p-4 text-xs leading-5 text-ink-soft"><strong className="block text-ink">Prefer a live discussion?</strong><Link href="/book-consultation#book-appointment" className="mt-1 inline-block font-bold text-accent-deep hover:underline">Book a Google Meet</Link></div></aside>
      <div className="order-1 min-w-0 space-y-7 lg:order-2">{groups.map((group, groupIndex) => <section key={group.category} aria-labelledby={`faq-group-${groupIndex}`}><div className="mb-2.5"><h2 id={`faq-group-${groupIndex}`} className="font-display text-xl font-extrabold tracking-[-0.02em] text-ink sm:text-2xl">{group.category}</h2>{group.description && <p className="mt-0.5 text-xs text-ink-faint">{group.description}</p>}</div><div className="overflow-hidden rounded-2xl border border-rule bg-white shadow-card">{group.items.map((faq, itemIndex) => <details key={faq._id} open={groupIndex === 0 && itemIndex === 0} className="group border-b border-rule-soft last:border-0"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-bold text-ink transition hover:bg-paper-alt sm:px-5 sm:py-4 sm:text-base [&::-webkit-details-marker]:hidden"><span>{faq.question}</span><ChevronDown className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-180" /></summary><div className="px-4 pb-4 text-xs leading-6 text-ink-soft sm:px-5 sm:pb-5 sm:text-sm sm:leading-7"><p className="whitespace-pre-line">{faq.answer}</p>{faq.linkHref && faq.linkLabel && <Link href={faq.linkHref} className="mt-2 inline-block font-bold text-accent-deep hover:underline">{faq.linkLabel}</Link>}</div></details>)}</div></section>)}</div>
    </div>
  </main>;
}
