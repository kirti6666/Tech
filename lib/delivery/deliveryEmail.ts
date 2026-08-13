import type { IssuedLicense } from "@/lib/delivery/issueLicenses";

/**
 * The delivery email.
 *
 * Deliberately does NOT contain a download link to the file itself. It
 * links to the dashboard, where a signed URL is minted on demand behind a
 * login. Two reasons: a signed URL in an email is stale within fifteen
 * minutes and generates support tickets, and a forwarded email would
 * otherwise be a working download for whoever received it.
 *
 * The licence key is in the body because customers do search their inbox
 * for it, and it isn't an authorisation token — downloads are authorised by
 * session ownership, not by holding the key.
 *
 * Plain tables and inline styles: every serious email client strips
 * <style> blocks and most ignore flexbox.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export function deliveryEmail({
  customerName,
  orderNumber,
  licenses,
  serviceCount,
}: {
  customerName: string;
  orderNumber: string;
  licenses: IssuedLicense[];
  serviceCount: number;
}): string {
  const rows = licenses
    .map(
      (license) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e7edf5;">
          <div style="font-size:15px;color:#0f1d33;font-weight:600;">${escapeHtml(license.productTitle)}</div>
          <div style="margin-top:6px;font-family:monospace;font-size:15px;letter-spacing:1px;color:#1b5fcc;">${license.key}</div>
        </td>
      </tr>`
    )
    .join("");

  const serviceNote =
    serviceCount > 0
      ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#44536b;">
           You also bought ${serviceCount === 1 ? "a service" : `${serviceCount} services`}.
           We need a few details before we can start — there's a short form
           on your purchases page.
         </p>`
      : "";

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f1d33;">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7d8aa0;">Order ${escapeHtml(orderNumber)}</p>
  <h1 style="margin:0 0 20px;font-size:22px;font-weight:600;">Your licence is ready</h1>

  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#44536b;">
    Thanks ${escapeHtml(customerName)} — your payment cleared and your purchase is ready to download.
  </p>

  <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
    <tr><td style="padding-bottom:4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7d8aa0;">Licence ${licenses.length === 1 ? "key" : "keys"}</td></tr>
    ${rows}
  </table>

  ${serviceNote}

  <p style="margin:0 0 24px;">
    <a href="${BASE_URL}/account/purchases"
       style="display:inline-block;background:#1b5fcc;color:#ffffff;text-decoration:none;padding:12px 20px;font-size:14px;font-weight:600;">
      Download your files
    </a>
  </p>

  <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#7d8aa0;">
    Download links are generated when you press the button and expire after
    fifteen minutes, so we can't email you one directly. Sign in and it will
    be there.
  </p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#7d8aa0;">
    Your GST invoice is attached to the order confirmation email.
  </p>
</div>`.trim();
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
