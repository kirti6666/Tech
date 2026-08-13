import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { sendVerificationEmail } from "@/lib/verification";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * POST /api/auth/resend-verification
 *
 * Requires a session rather than taking an address in the body. An
 * unauthenticated "resend to this address" endpoint is a free email cannon
 * pointed at anyone, and a way to check which addresses have accounts.
 *
 * Three per hour. Verification emails are the classic accidental spam
 * source — one impatient customer clicking Resend twenty times is enough to
 * get a sending domain flagged.
 */
export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const limit = await checkRateLimit(`resend:${user.id}`, 3, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          "We've sent a few already. Check your spam folder, then try again in an hour.",
      },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const record = await User.findById(user.id).select("name email isVerified");
    if (!record) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (record.isVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    await sendVerificationEmail(user.id, record.email, record.name);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/resend-verification failed:", error);
    return NextResponse.json(
      { error: "Could not send the email. Please try again." },
      { status: 500 }
    );
  }
}
