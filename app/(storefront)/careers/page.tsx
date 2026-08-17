import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, Code2, HeartHandshake, Megaphone, Palette, Sparkles, UsersRound } from "lucide-react";
import { CareerApplicationForm } from "@/components/storefront/CareerApplicationForm";

export const metadata: Metadata = { title: "Careers | TechBro", description: "Join TechBro and help businesses launch useful software with confidence.", alternates: { canonical: "/careers" } };

const departments = [
  { icon: Code2, name: "Engineering", text: "Build reliable products with a sharp eye for performance and usability." },
  { icon: Palette, name: "Design", text: "Turn complex workflows into clear, thoughtful customer experiences." },
  { icon: Megaphone, name: "Growth", text: "Connect the right products with the right businesses." },
  { icon: HeartHandshake, name: "Customer experience", text: "Help customers move from purchase to a confident launch." },
];

export default function CareersPage() {
  return <main className="bg-white">
    <section className="border-b border-rule-soft bg-[#f4f7fb] px-4 py-10 text-center sm:px-6 sm:py-16 lg:py-20"><div className="mx-auto max-w-4xl"><p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-accent-deep">Careers at TechBro</p><h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.05em] text-ink sm:text-6xl">Let’s build useful things, together.</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink-soft sm:text-lg">Join a small, ambitious team helping businesses own and launch software that works for them.</p><Link href="#apply" className="btn-primary mt-6">Apply now <ArrowDown size={16} /></Link></div></section>
    <section className="mx-auto grid max-w-shell gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[.85fr_1.15fr] lg:items-start"><div className="order-2 lg:order-1"><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-accent-deep">Find your place</p><h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">What’s your craft?</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{departments.map(({ icon: Icon, name, text }) => <article key={name} className="flex gap-3 rounded-xl border border-rule-soft bg-paper-alt p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-accent-deep ring-1 ring-rule"><Icon size={19} /></span><div><h3 className="font-bold text-ink">{name}</h3><p className="mt-1 text-xs leading-5 text-ink-soft">{text}</p></div></article>)}</div></div><div className="order-1 lg:order-2"><CareerApplicationForm /></div></section>
    <section className="border-y border-rule-soft bg-[#071a3d] px-4 py-10 text-white sm:px-6 sm:py-14"><div className="mx-auto max-w-shell"><div className="text-center"><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-200">How we work</p><h2 className="mt-2 font-display text-3xl font-extrabold">Curious, practical and kind.</h2></div><div className="mt-7 grid gap-3 sm:grid-cols-3">{[{ icon: Sparkles, title: "Stay curious", text: "Ask better questions and keep improving the work." },{ icon: UsersRound, title: "Work as one team", text: "Share context, listen closely and celebrate each other’s wins." },{ icon: HeartHandshake, title: "Make it useful", text: "Choose clarity and customer value over unnecessary complexity." }].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-xl border border-white/10 bg-white/[0.06] p-5"><Icon className="h-5 w-5 text-blue-200" /><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></article>)}</div></div></section>
  </main>;
}
