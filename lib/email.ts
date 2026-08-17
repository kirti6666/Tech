import nodemailer from "nodemailer";

let transport: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransport() {
  if (transport !== undefined) return transport;

  const host = process.env.EMAIL_SERVER_HOST ?? process.env.SMTP_HOST;
  const user = process.env.EMAIL_SERVER_USER ?? process.env.SMTP_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD ?? process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    transport = null;
    return transport;
  }

  transport = nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_SERVER_PORT ?? process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT ?? process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
  });
  return transport;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
}

export function isEmailConfigured(): boolean {
  return Boolean(
    (process.env.EMAIL_SERVER_HOST ?? process.env.SMTP_HOST) &&
    (process.env.EMAIL_SERVER_USER ?? process.env.SMTP_USER) &&
    (process.env.EMAIL_SERVER_PASSWORD ?? process.env.SMTP_PASSWORD)
  );
}

/**
 * Sends an email if SMTP is configured, otherwise logs and no-ops.
 * Email failures should never break the order flow they're attached to —
 * callers don't need to (and shouldn't) await-and-fail on this.
 */
export async function sendEmail({ to, subject, html, replyTo, attachments }: SendEmailParams): Promise<boolean> {
  const transport = getTransport();

  if (!transport) {
    console.warn(`[email] SMTP not configured — skipping "${subject}" to ${to}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@store.com",
      to,
      replyTo,
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
