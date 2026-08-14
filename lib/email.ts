import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.EMAIL_SERVER_HOST ?? process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_SERVER_PORT ?? process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT ?? process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER ?? process.env.SMTP_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD ?? process.env.SMTP_PASSWORD,
    },
  });
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_SERVER_HOST ?? process.env.SMTP_HOST);
}

/**
 * Sends an email if SMTP is configured, otherwise logs and no-ops.
 * Email failures should never break the order flow they're attached to —
 * callers don't need to (and shouldn't) await-and-fail on this.
 */
export async function sendEmail({ to, subject, html, attachments }: SendEmailParams): Promise<boolean> {
  const transport = getTransport();

  if (!transport) {
    console.warn(`[email] SMTP not configured — skipping "${subject}" to ${to}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@store.com",
      to,
      subject,
      html,
      attachments,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}
