"use client";

import { useState } from "react";

/**
 * Download button.
 *
 * Two steps, both deliberate: the click POSTs for a signed URL, then
 * navigates to it. The URL is never rendered into the page as an href,
 * because a link in the DOM can be right-click-copied and pasted into a
 * group chat — and for fifteen minutes it would work for whoever got it.
 *
 * The remaining count is shown before the click, not after. Someone with
 * one download left should know that before they spend it.
 */
export function DownloadButton({
  licenseKey,
  remaining,
  revoked,
}: {
  licenseKey: string;
  remaining: number;
  revoked: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(remaining);

  async function download() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/downloads/${encodeURIComponent(licenseKey)}`,
        { method: "POST" }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not start the download.");
        return;
      }

      setLeft(data.downloadsRemaining);
      // Assigning to location rather than opening a tab: the response is an
      // attachment, so the browser downloads it and stays where it is. A
      // popup would be blocked on some setups anyway.
      window.location.href = data.url;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (revoked) {
    return (
      <p className="text-sm text-ink-soft">
        This licence has been revoked. Get in touch if that looks wrong.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={busy || left <= 0}
        className="border border-accent-deep bg-accent-deep px-4 py-2 text-label font-medium uppercase tracking-[0.06em] text-white hover:bg-accent-deep hover:border-accent-deep disabled:opacity-60"
      >
        {busy ? "Preparing…" : "Download source"}
      </button>

      <p className="mt-1.5 text-xs text-ink-faint">
        {left > 0
          ? `${left} download${left === 1 ? "" : "s"} remaining. Links expire after 15 minutes.`
          : "You've used all your downloads. Contact support and we'll reset it."}
      </p>

      {error && <p className="mt-1.5 text-xs text-accent-deep">{error}</p>}
    </div>
  );
}
