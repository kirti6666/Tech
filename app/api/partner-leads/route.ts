import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import PartnerLead from "@/models/PartnerLead";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit(`partner-lead:${ip}`, 5, 60 * 60);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    // Honeypot: return success without storing bot submissions.
    if (String(body.company_website ?? "").trim()) {
      return NextResponse.json({ ok: true });
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const city = String(body.city ?? "").trim();
    const occupation = String(body.occupation ?? "").trim();
    const partnershipType = String(body.partnershipType ?? "");
    const experience = String(body.experience ?? "").trim();
    const message = String(body.message ?? "").trim();

    const errors: Record<string, string> = {};
    if (!name || name.length > 120) errors.name = "Enter your name.";
    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!phone || phone.length > 30) errors.phone = "Enter your phone number.";
    if (!city || city.length > 100) errors.city = "Enter your city.";
    if (!occupation || occupation.length > 120) errors.occupation = "Tell us what you do.";
    if (!["refer_clients", "sell_products", "both"].includes(partnershipType)) {
      errors.partnershipType = "Choose how you want to partner with us.";
    }
    if (message.length < 30 || message.length > 2000) {
      errors.message = "Explain your plan in at least 30 characters.";
    }

    if (Object.keys(errors).length) {
      return NextResponse.json({ error: "Please check the highlighted fields.", fields: errors }, { status: 400 });
    }

    await connectDB();

    await PartnerLead.findOneAndUpdate(
      { email },
      {
        $set: {
          name: name.slice(0, 120),
          phone: phone.slice(0, 30),
          city: city.slice(0, 100),
          occupation: occupation.slice(0, 120),
          partnershipType,
          experience: experience.slice(0, 1000),
          message: message.slice(0, 2000),
          source: "partner_page",
          ip,
        },
        $setOnInsert: { status: "new" },
      },
      { upsert: true, new: true }
    );

    // Send customer and admin messages concurrently so a serverless request
    // does not spend two SMTP round trips waiting in sequence.
    const customerDelivery = sendEmail({
      to: email,
      subject: "Welcome to the TechBro Partner Programme",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#081a3a">
          <h1 style="font-size:24px">Your partner application is registered.</h1>
          <p>Thank you, ${escapeHtml(name)}. Our team will review your details and contact you with the referral and product-selling process.</p>
          <p style="color:#66758d;font-size:13px">Partner rewards are subject to programme terms and successful referrals.</p>
        </div>
      `,
    });

    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      process.env.APPOINTMENT_ADMIN_EMAIL;

    const adminDelivery = adminEmail
      ? sendEmail({
        to: adminEmail,
        subject: "New TechBro partner registration",
        html: `<p>A new partner application has been submitted.</p>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
          <p><strong>City:</strong> ${escapeHtml(city)}</p>
          <p><strong>Occupation:</strong> ${escapeHtml(occupation)}</p>
          <p><strong>Partnership:</strong> ${escapeHtml(partnershipType.replace("_", " "))}</p>
          ${experience ? `<p><strong>Experience / network:</strong> ${escapeHtml(experience)}</p>` : ""}
          <p><strong>Plan:</strong><br>${escapeHtml(message)}</p>`,
      })
      : Promise.resolve(false);

    const [, adminSent] = await Promise.all([customerDelivery, adminDelivery]);

    if (!adminSent) {
      return NextResponse.json(
        { error: "Your application was saved, but the admin email could not be delivered. Please try again shortly." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // A concurrent request may create the same unique email first.
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ ok: true, alreadyRegistered: true });
    }

    console.error("POST /api/partner-leads failed:", error);
    return NextResponse.json(
      { error: "Registration could not be completed. Please try again." },
      { status: 500 }
    );
  }
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
