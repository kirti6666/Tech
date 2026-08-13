import type { AddonType, ServiceStatus } from "@/types/catalog";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

const TYPE_LABELS: Record<AddonType, string> = {
  rebranding: "rebranding",
  deployment: "deployment",
  maintenance: "maintenance",
};

/**
 * Status-change emails.
 *
 * One email per real transition, and only for transitions the customer
 * cares about. "In progress" and "delivered" are worth an email; an admin
 * editing an internal note is not, which is why this is only called when
 * the status actually changed.
 *
 * The delivered message deliberately mentions credential deletion. Someone
 * who handed over a server password wants to know it's gone, and saying so
 * unprompted is worth more than a line buried in a privacy policy.
 */
export function serviceStatusEmail({
  customerName,
  type,
  status,
  note,
  requestId,
}: {
  customerName: string;
  type: AddonType;
  status: ServiceStatus;
  note?: string;
  requestId: string;
}): string {
  const label = TYPE_LABELS[type];

  const headline =
    status === "delivered"
      ? `Your ${label} is done`
      : status === "in_progress"
        ? `We've started your ${label}`
        : `Update on your ${label}`;

  const body =
    status === "delivered"
      ? `The work is finished and handed over. Any credentials you shared with us have been deleted from our systems.`
      : status === "in_progress"
        ? `We've picked up your request and started work. We'll let you know as soon as it's ready.`
        : `Your request is queued.`;

  const noteBlock = note
    ? `<p style="margin:0 0 16px;padding:12px 14px;background:#f4f7fb;font-size:14px;line-height:1.6;color:#44536b;">${escapeHtml(note)}</p>`
    : "";

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f1d33;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;">${escapeHtml(headline)}</h1>

  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#44536b;">
    Hi ${escapeHtml(customerName)} — ${body}
  </p>

  ${noteBlock}

  <p style="margin:0 0 24px;">
    <a href="${BASE_URL}/account/services/${requestId}"
       style="display:inline-block;background:#1b5fcc;color:#ffffff;text-decoration:none;padding:12px 20px;font-size:14px;font-weight:600;">
      View your request
    </a>
  </p>
</div>`.trim();
}

export function enquiryReceivedEmail(name: string): string {
  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f1d33;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;">We've got your message</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#44536b;">
    Thanks ${escapeHtml(name)} — someone will read this properly and reply within one working day.
  </p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#7d8aa0;">
    If it's urgent, reply to this email and it'll come straight to us.
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
