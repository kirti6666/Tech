"use client";

import Script from "next/script";

/**
 * Google Analytics 4.
 *
 * Three deliberate choices:
 *
 * `afterInteractive` rather than `beforeInteractive` — analytics must never
 * be in the critical path of a page a customer is trying to buy from.
 *
 * Renders nothing when NEXT_PUBLIC_GA_ID is unset, so development and
 * preview deployments don't pollute production numbers with your own
 * clicking.
 *
 * IP anonymisation on, and no personal data ever passed. Sending an email
 * address or order-linked identifier to Google would be a problem under
 * both their terms and your own privacy policy, which says analytics is
 * aggregate only. If you later add purchase tracking, send amounts and
 * product names — never the customer.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

/**
 * Fires a GA event if analytics is loaded. Safe to call anywhere — it's a
 * no-op when GA is absent, so callers don't need their own guards.
 *
 * Deliberately not called anywhere yet. Add it where a conversion step
 * genuinely needs measuring (demo opened, checkout started) rather than
 * instrumenting everything and drowning the useful signal.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", name, params ?? {});
}
