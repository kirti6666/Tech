import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import License from "@/models/License";
import Product from "@/models/Product";
import DownloadLog from "@/models/DownloadLog";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { createDownloadUrl, isStorageConfigured } from "@/lib/storage";
import { normaliseLicenseKey } from "@/lib/licenseKey";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * POST /api/downloads/[key] — mints a short-lived download URL.
 *
 * This is the only route in the application that can hand out a paid source
 * archive, so the whole authorisation decision lives here and is made in one
 * place, in this order:
 *
 *   1. signed in
 *   2. rate limit
 *   3. licence exists AND belongs to this user
 *   4. licence is active (not revoked by a refund)
 *   5. download count is below the limit
 *
 * Step 3 is why the licence key is not an authorisation token. Knowing a
 * key gets you nothing — the query is scoped to the session's user id, so a
 * leaked or forwarded key downloads nothing for anyone else.
 *
 * The counter is incremented atomically in the same update that re-checks
 * the limit, so two tabs pressing Download together can't both slip past a
 * limit of one.
 *
 * POST rather than GET: a GET would be prefetched by browsers and link
 * previewers, silently burning downloads the customer never asked for.
 */

export async function POST(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  if (!isStorageConfigured()) {
    console.error("[downloads] STORAGE_* env vars are not configured.");
    return NextResponse.json(
      { error: "Downloads are temporarily unavailable. Please contact support." },
      { status: 503 }
    );
  }

  // Ten attempts an hour per user is far above honest use — nobody
  // re-downloads a 300 MB archive ten times in an hour — and well below what
  // makes scripted enumeration worthwhile.
  const limited = await checkRateLimit(`download:${user.id}`, 10, 60 * 60);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many download attempts. Try again in a little while." },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const key = normaliseLicenseKey(decodeURIComponent(params.key));

    // Ownership is part of the query, not a check afterwards. There is no
    // code path here that loads a licence without also constraining it to
    // the signed-in user.
    const license = await License.findOne({ key, user: user.id });

    if (!license) {
      return NextResponse.json({ error: "Licence not found" }, { status: 404 });
    }

    const context = {
      license: license._id,
      user: user.id,
      product: license.product,
      ip: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    };

    if (license.status === "revoked") {
      await DownloadLog.create({ ...context, outcome: "denied_revoked" });
      return NextResponse.json(
        {
          error:
            "This licence has been revoked. If you think that's a mistake, get in touch.",
        },
        { status: 403 }
      );
    }

    const product = await Product.findById(license.product).select(
      "title slug sourceFileKey sourceFileName"
    );

    if (!product?.sourceFileKey) {
      // The customer paid and we have nothing to give them. Loud on the
      // server, apologetic on the client — this is our failure, not theirs.
      console.error(
        `[downloads] Licence ${license.key} points at product ${license.product} which has no sourceFileKey.`
      );
      return NextResponse.json(
        { error: "This file isn't ready yet. We've been notified — please contact support." },
        { status: 503 }
      );
    }

    // Atomic claim: re-checks the limit and increments in one operation, so
    // concurrent requests can't both pass a check that only one should.
    const claimed = await License.findOneAndUpdate(
      {
        _id: license._id,
        status: "active",
        $expr: { $lt: ["$downloadCount", "$downloadLimit"] },
      },
      { $inc: { downloadCount: 1 }, $set: { lastDownloadedAt: new Date() } },
      { new: true }
    );

    if (!claimed) {
      await DownloadLog.create({ ...context, outcome: "denied_limit" });
      return NextResponse.json(
        {
          error: `You've used all ${license.downloadLimit} downloads for this licence. Contact support and we'll reset it.`,
        },
        { status: 403 }
      );
    }

    const filename =
      product.sourceFileName || `${product.slug}-source.zip`;
    const url = await createDownloadUrl(product.sourceFileKey, filename);

    // Logged on issue, not on completion. A URL that has been handed out has
    // already left our control whether or not the transfer finished.
    await DownloadLog.create({ ...context, outcome: "issued" });

    return NextResponse.json({
      url,
      filename,
      expiresInSeconds: 15 * 60,
      downloadsRemaining: Math.max(0, claimed.downloadLimit - claimed.downloadCount),
    });
  } catch (error) {
    console.error("POST /api/downloads failed:", error);
    return NextResponse.json(
      { error: "Could not prepare your download. Please try again." },
      { status: 500 }
    );
  }
}
