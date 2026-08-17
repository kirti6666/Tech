"use client";

import { useState } from "react";
import Link from "next/link";
import { AppWindow, CalendarDays, Check, Copy, Download, ExternalLink, Globe2, Headphones, ShieldCheck, Smartphone } from "lucide-react";

interface DemoPanelProps {
  demo: {
    webUrl?: string;
    adminUrl?: string;
    adminUser?: string;
    adminPass?: string;
    appStoreUrl?: string;
    playStoreUrl?: string;
    workflowVideoUrl?: string;
  };
}

/**
 * The demo is the single highest-intent element on the page — a buyer who
 * opens the admin panel and finds it working is most of the way to paying.
 * So the credentials are shown in full and copyable rather than hidden
 * behind a "request demo access" form.
 *
 * These are throwaway credentials for a sandbox that gets reset. If that
 * ever stops being true, this component is the reason it matters.
 */
export function DemoPanel({ demo }: DemoPanelProps) {
  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-3 shadow-card sm:p-4" aria-label="Product demos and support">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
          <PreviewAction href={demo.webUrl} title="Live Web Demo" readyText="Try it online now" icon={<Globe2 className="h-5 w-5" aria-hidden="true" />} tone="blue" />
          <PreviewAction href={demo.playStoreUrl} title="Android App Demo" readyText="Open in Google Play" icon={<Smartphone className="h-5 w-5" aria-hidden="true" />} tone="emerald" />
          <PreviewAction href={demo.appStoreUrl} title="iOS App Demo" readyText="Open in App Store" icon={<AppWindow className="h-5 w-5" aria-hidden="true" />} tone="sky" />
          <Link href="/book-consultation" className="group col-span-3 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-extrabold text-orange-700 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md lg:col-span-1 lg:min-h-16 lg:whitespace-nowrap lg:px-1.5 lg:text-xs">
            <CalendarDays className="h-5 w-5" aria-hidden="true" /> Schedule a Demo
          </Link>
      </div>

      <div className="mt-2.5 grid grid-cols-3 divide-x divide-blue-100 rounded-xl border border-blue-100 bg-white/80 py-2.5 text-center">
        <Link href="/refund-policy" className="flex flex-col items-center justify-center gap-1 px-1 text-[9px] font-semibold leading-tight text-ink-soft sm:flex-row sm:gap-2 sm:text-xs"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />7-day refund policy</Link>
        <span className="flex flex-col items-center justify-center gap-1 px-1 text-[9px] font-semibold leading-tight text-ink-soft sm:flex-row sm:gap-2 sm:text-xs"><Headphones className="h-4 w-4 shrink-0 text-blue-600" />30-day setup support</span>
        <span className="flex flex-col items-center justify-center gap-1 px-1 text-[9px] font-semibold leading-tight text-ink-soft sm:flex-row sm:gap-2 sm:text-xs"><Download className="h-4 w-4 shrink-0 text-violet-600" />Instant account access</span>
      </div>

      {demo.adminUrl && <div className="mt-2.5 rounded-xl border border-blue-100 bg-white/80 p-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-5"><a href={demo.adminUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-accent-deep hover:underline">Open admin demo <ExternalLink className="h-4 w-4" /></a>

        {(demo.adminUser || demo.adminPass) && (
          <dl className="mt-2 divide-y divide-rule-soft border-t border-rule-soft pt-2 text-sm lg:mt-0 lg:grid lg:min-w-0 lg:grid-cols-2 lg:gap-4 lg:divide-y-0 lg:border-t-0 lg:pt-0">
            {demo.adminUser && (
              <CredentialRow label="Username" value={demo.adminUser} />
            )}
            {demo.adminPass && (
              <CredentialRow label="Password" value={demo.adminPass} />
            )}
          </dl>
        )}
      </div>}
    </section>
  );
}

const actionTones = {
  blue: "border-blue-200 bg-blue-50 text-blue-700 [&_.action-icon]:bg-blue-100 [&_.action-copy]:text-blue-500",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 [&_.action-icon]:bg-emerald-100 [&_.action-copy]:text-emerald-600",
  sky: "border-sky-200 bg-sky-50 text-sky-700 [&_.action-icon]:bg-sky-100 [&_.action-copy]:text-sky-600",
  violet: "border-violet-200 bg-violet-50 text-violet-700 [&_.action-icon]:bg-violet-100 [&_.action-copy]:text-violet-500",
};

function PreviewAction({ href, title, readyText, icon, tone }: {
  href?: string;
  title: string;
  readyText: string;
  icon: React.ReactNode;
  tone: keyof typeof actionTones;
}) {
  const classes = `flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 text-center transition sm:min-h-16 sm:flex-row sm:justify-start sm:gap-2.5 sm:px-3 sm:text-left ${
    href
      ? `group hover:-translate-y-0.5 hover:shadow-md ${actionTones[tone]}`
      : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
  }`;
  const content = <>
    <span className={`action-icon grid h-8 w-8 shrink-0 place-items-center rounded-full ${href ? "" : "bg-slate-200/70"}`}>{icon}</span>
    <span className="min-w-0"><strong className="block text-[10px] leading-tight sm:text-sm">{title}</strong><small className={`action-copy mt-1 block text-[9px] leading-tight sm:text-[11px] ${href ? "" : "text-slate-400"}`}>{href ? readyText : "Coming soon"}</small></span>
    {href && <ExternalLink className="ml-auto hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />}
  </>;

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className={classes}>{content}</a>
  ) : (
    <span aria-disabled="true" className={classes}>{content}</span>
  );
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is blocked in some embedded browsers; the value is
      // selectable on screen either way, so there is nothing to report.
    }
  }

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 py-2 lg:flex-col lg:items-start lg:gap-1 lg:py-0">
      <dt className="label-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 lg:w-full lg:justify-between">
        <code className="min-w-0 break-all font-mono text-xs text-ink">{value}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={`${copied ? "Copied" : "Copy"} ${label.toLowerCase()}`}
          title={copied ? "Copied" : `Copy ${label.toLowerCase()}`}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
            copied
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-blue-100 bg-blue-50 text-accent-deep hover:border-blue-300 hover:bg-blue-100"
          }`}
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        </button>
      </dd>
    </div>
  );
}
