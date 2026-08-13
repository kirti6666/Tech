"use client";

import { useState } from "react";

interface DemoPanelProps {
  demo: {
    webUrl?: string;
    adminUrl?: string;
    adminUser?: string;
    adminPass?: string;
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
  const hasDemo = Boolean(demo.webUrl || demo.adminUrl);
  if (!hasDemo) return null;

  return (
    <section className="border border-rule">
      <h2 className="border-b border-rule bg-paper-alt px-4 py-2 label-muted">
        Try it before you buy
      </h2>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {demo.webUrl && (
            <a
              href={demo.webUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="btn-primary"
            >
              Open live demo
            </a>
          )}
          {demo.adminUrl && (
            <a
              href={demo.adminUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="btn-secondary"
            >
              Open admin demo
            </a>
          )}
        </div>

        {(demo.adminUser || demo.adminPass) && (
          <dl className="divide-y divide-rule-soft border-t border-rule-soft pt-3 text-sm">
            {demo.adminUser && (
              <CredentialRow label="Username" value={demo.adminUser} />
            )}
            {demo.adminPass && (
              <CredentialRow label="Password" value={demo.adminPass} />
            )}
          </dl>
        )}
      </div>
    </section>
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
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="label-muted">{label}</dt>
      <dd className="flex items-center gap-2">
        <code className="font-mono text-sm text-ink">{value}</code>
        <button
          type="button"
          onClick={copy}
          className="text-label font-medium uppercase tracking-[0.06em] text-accent-deep hover:underline"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </dd>
    </div>
  );
}
