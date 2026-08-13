import User from "@/models/User";
import VerificationToken, {
  generateVerificationToken,
  hashToken,
} from "@/models/VerificationToken";
import { sendEmail } from "@/lib/email";

/**
 * Email verification.
 *
 * WHAT IT DOES AND DOESN'T GATE — decide this deliberately.
 *
 * Verification is NOT required to buy. Blocking checkout behind a
 * confirmation email costs real orders: the customer is holding a card,
 * the email is in spam, and they leave. The order is real either way,
 * because the payment cleared.
 *
 * What it does gate is the address that receives licence keys and download
 * links. A typo'd email means delivery lands in a stranger's inbox, so the
 * purchases page prompts for verification and support treats an unverified
 * address as unconfirmed when someone asks for a licence to be resent.
 *
 * That is the right balance for a business selling to people who mostly buy
 * once: verify the delivery channel, don't obstruct the sale.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "";

export async function sendVerificationEmail(
  userId: string,
  email: string,
  name?: string
): Promise<void> {
  // One live token per user. Issuing a new one invalidates the old, so a
  // link forwarded or logged earlier stops working.
  await VerificationToken.deleteMany({ user: userId });

  const { raw, hash, expiresAt } = generateVerificationToken();

  await VerificationToken.create({
    user: userId,
    tokenHash: hash,
    email: email.toLowerCase(),
    expiresAt,
  });

  const link = `${BASE_URL}/verify-email?token=${raw}`;

  await sendEmail({
    to: email,
    subject: "Confirm your email — TechBro",
    html: `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;">Confirm your email</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#52525b;">
    Hi ${escapeHtml(name ?? "there")} — confirm this address so we know your
    licence keys and download links will reach you.
  </p>
  <p style="margin:0 0 24px;">
    <a href="${link}" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:12px 20px;font-size:14px;font-weight:600;border-radius:8px;">
      Confirm email address
    </a>
  </p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
    This link expires in 24 hours. If you didn't create a TechBro account,
    ignore this email — nothing will happen.
  </p>
</div>`.trim(),
  });
}

export type VerifyOutcome =
  | { ok: true; alreadyVerified: boolean }
  | { ok: false; reason: "invalid" | "expired" | "email_changed" };

export async function verifyEmailToken(raw: string): Promise<VerifyOutcome> {
  const record = await VerificationToken.findOne({ tokenHash: hashToken(raw) });

  // No record covers three cases that look identical to the user: never
  // existed, already used, or expired and swept by the TTL index. All get
  // the same answer, with a resend offered — enumerating which one it was
  // tells an attacker whether an address is registered.
  if (!record) return { ok: false, reason: "invalid" };

  if (record.expiresAt < new Date()) {
    await VerificationToken.deleteOne({ _id: record._id });
    return { ok: false, reason: "expired" };
  }

  const user = await User.findById(record.user);
  if (!user) return { ok: false, reason: "invalid" };

  // The address changed after the link was sent, so this token no longer
  // proves anything about the current one.
  if (user.email.toLowerCase() !== record.email) {
    await VerificationToken.deleteOne({ _id: record._id });
    return { ok: false, reason: "email_changed" };
  }

  const alreadyVerified = Boolean(user.isVerified);

  user.isVerified = true;
  await user.save();
  await VerificationToken.deleteOne({ _id: record._id });

  return { ok: true, alreadyVerified };
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
