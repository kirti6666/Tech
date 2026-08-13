import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyEmailToken } from "@/lib/verification";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * POST /api/auth/verify — confirms an address from the emailed link.
 *
 * POST rather than GET, even though it's reached from a link. Email clients
 * and security scanners prefetch links, and a GET here would mark addresses
 * verified without the recipient opening anything. The page at
 * /verify-email loads and then posts.
 *
 * Rate limited by IP because the token is the only secret: without a limit
 * this is a guessing oracle, and 32 random bytes is only unguessable if you
 * can't try millions of times.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limit = await checkRateLimit(`verify:${ip}`, 10, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429 }
    );
  }

  try {
    const { token } = await req.json();
    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    await connectDB();
    const result = await verifyEmailToken(token);

    if (!result.ok) {
      const messages = {
        invalid: "That link isn't valid. It may already have been used.",
        expired: "That link has expired.",
        email_changed:
          "Your email address changed after this link was sent, so it no longer applies.",
      };
      return NextResponse.json(
        { error: messages[result.reason], canResend: true },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyVerified: result.alreadyVerified,
    });
  } catch (error) {
    console.error("POST /api/auth/verify failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
