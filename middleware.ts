import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Rate limiting for the authentication surface.
 *
 * Applied in middleware rather than inside each route for one reason: the
 * sign-in path runs through NextAuth's catch-all handler, which isn't a
 * file you own and shouldn't be forking to add a limiter. Middleware covers
 * it, the register route, and password reset uniformly — and any auth route
 * added later is protected by matching the path, not by someone remembering.
 *
 * Limits are per IP and deliberately generous enough that a person who
 * mistypes a password five times is unaffected, while a credential-stuffing
 * run stops being economical. They are a speed bump, not a wall: a
 * distributed attack has many IPs. The real defences are bcrypt and
 * password quality.
 *
 * WITHOUT UPSTASH, THIS BARELY WORKS. The fallback limiter is per-process,
 * and serverless runs many processes, so the effective limit multiplies by
 * the instance count. Set UPSTASH_REDIS_REST_URL in production or accept
 * that this is decorative.
 */

const RULES: { pattern: RegExp; limit: number; windowSeconds: number; label: string }[] = [
  // Sign-in attempts. Tight, because this is what gets attacked.
  {
    pattern: /^\/api\/auth\/callback\/credentials/,
    limit: 8,
    windowSeconds: 15 * 60,
    label: "login",
  },
  {
    pattern: /^\/api\/auth\/login/,
    limit: 8,
    windowSeconds: 15 * 60,
    label: "login",
  },
  // Account creation. Slower still — nobody legitimately needs five
  // accounts in an hour, and this is the endpoint that fills a database
  // with junk users.
  {
    pattern: /^\/api\/auth\/register/,
    limit: 5,
    windowSeconds: 60 * 60,
    label: "register",
  },
  // Password reset requests send email, so the cost of abuse is a flagged
  // sending domain, not just noise.
  {
    pattern: /^\/api\/auth\/(forgot-password|reset-password)/,
    limit: 5,
    windowSeconds: 60 * 60,
    label: "reset",
  },
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const rule = RULES.find((r) => r.pattern.test(path));
  if (!rule) return NextResponse.next();

  // Only mutating requests. NextAuth issues GETs to these paths for CSRF
  // tokens and provider metadata on ordinary page loads, and limiting those
  // would break sign-in for a normal visitor.
  if (req.method !== "POST") return NextResponse.next();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const result = await checkRateLimit(
    `auth:${rule.label}:${ip}`,
    rule.limit,
    rule.windowSeconds
  );

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, retryAfter)),
          "X-RateLimit-Limit": String(rule.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(rule.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  return response;
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
