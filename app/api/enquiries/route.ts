import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { enquiryReceivedEmail } from "@/lib/services/notifications";

/**
 * POST /api/enquiries — contact form and custom-work lead capture.
 *
 * Public and unauthenticated, which makes it the most exposed write in the
 * application. Three defences, in order of how much they actually catch:
 *
 *  1. Rate limit by IP — five an hour is generous for a human and useless
 *     for a bot.
 *  2. Honeypot field — a hidden input real users never fill in. Filled means
 *     a form-filling bot, and the response is a cheerful 200 so it doesn't
 *     learn to adapt.
 *  3. Length caps and a shape check on the email.
 *
 * No CAPTCHA. It punishes every genuine visitor to stop spam that the first
 * two catch most of anyway; add one only if the log shows you need it.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limit = await checkRateLimit(`enquiry:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You've sent a few messages already. Try again in an hour." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    // Honeypot. Silent success — telling a bot it failed just teaches it.
    if (String(body.company_website ?? "").trim()) {
      return NextResponse.json({ ok: true });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const message = String(body.message ?? "").trim();
    const source = body.source === "custom_work" ? "custom_work" : "contact";

    const errors: Record<string, string> = {};
    if (!name) errors.name = "Enter your name";
    if (!email) errors.email = "Enter an email address";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errors.email = "That email address doesn't look right";
    }
    if (!message) errors.message = "Tell us what you need";
    else if (message.length > 5000) errors.message = "That's a bit long — trim it down";

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { error: "Please check the highlighted fields", fields: errors },
        { status: 400 }
      );
    }

    await connectDB();

    const enquiry = await Enquiry.create({
      name: name.slice(0, 120),
      email,
      phone: String(body.phone ?? "").trim().slice(0, 30) || undefined,
      company: String(body.company ?? "").trim().slice(0, 120) || undefined,
      message,
      source,
      productContext: body.productId || undefined,
      budget: String(body.budget ?? "").trim().slice(0, 60) || undefined,
      status: "new",
      ip,
    });

    // Acknowledge to the customer, notify the team. Both are best-effort:
    // the enquiry is already saved, and a mail failure must not tell someone
    // their message didn't arrive when it did.
    await sendEmail({
      to: email,
      subject: "We've got your message — TechBro",
      html: enquiryReceivedEmail(name),
    });

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New ${source === "custom_work" ? "custom work" : "contact"} enquiry — ${name}`,
        html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
               ${body.phone ? `<p>Phone: ${escapeHtml(String(body.phone))}</p>` : ""}
               ${body.budget ? `<p>Budget: ${escapeHtml(String(body.budget))}</p>` : ""}
               <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
               <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/enquiries/${enquiry._id}">Open in admin</a></p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/enquiries failed:", error);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
