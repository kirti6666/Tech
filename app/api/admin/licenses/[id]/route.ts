import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import License from "@/models/License";
import Product from "@/models/Product";
import DownloadLog from "@/models/DownloadLog";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { generateUniqueLicenseKey } from "@/lib/licenseKey";
import { inviteCollaborator, removeCollaborator } from "@/lib/github";

/**
 * GET   /api/admin/licenses/[id] — licence plus its download history
 * PATCH /api/admin/licenses/[id] — the support actions
 *
 * The actions exist because these are the four things support actually gets
 * asked for: "my downloads ran out", "revoke this refunded order", "the key
 * leaked, give me a new one", "add me to the repo".
 *
 * `regenerate` issues a new key on the same licence rather than creating a
 * second licence — the compound unique index on { order, product } would
 * reject a second one, and correctly so: one purchase is one entitlement,
 * whatever string identifies it today.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const license = await License.findById(params.id)
    .populate("user", "name email")
    .populate("product", "title slug githubRepo")
    .lean();

  if (!license) {
    return NextResponse.json({ error: "Licence not found" }, { status: 404 });
  }

  const downloads = await DownloadLog.find({ license: params.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ license, downloads });
}

type Action =
  | "revoke"
  | "reinstate"
  | "reset_downloads"
  | "set_limit"
  | "regenerate_key"
  | "github_invite"
  | "github_remove";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await req.json();
    const action: Action = body.action;

    const license = await License.findById(params.id);
    if (!license) {
      return NextResponse.json({ error: "Licence not found" }, { status: 404 });
    }

    switch (action) {
      case "revoke": {
        if (!body.reason?.trim()) {
          // A revocation with no reason is unexplainable six months later,
          // which is exactly when someone asks.
          return NextResponse.json(
            { error: "A reason is required to revoke a licence" },
            { status: 400 }
          );
        }
        license.status = "revoked";
        license.revokedAt = new Date();
        license.revokedReason = body.reason.trim();
        license.revokedBy = admin.id as never;
        break;
      }

      case "reinstate": {
        license.status = "active";
        license.revokedAt = undefined;
        license.revokedReason = undefined;
        license.revokedBy = undefined;
        break;
      }

      case "reset_downloads": {
        license.downloadCount = 0;
        break;
      }

      case "set_limit": {
        const limit = Number(body.downloadLimit);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
          return NextResponse.json(
            { error: "Download limit must be between 1 and 100" },
            { status: 400 }
          );
        }
        license.downloadLimit = limit;
        break;
      }

      case "regenerate_key": {
        license.key = await generateUniqueLicenseKey();
        break;
      }

      case "github_invite": {
        const username = String(body.githubUsername ?? "").trim();
        if (!username) {
          return NextResponse.json(
            { error: "A GitHub username is required" },
            { status: 400 }
          );
        }
        const product = await Product.findById(license.product).select("githubRepo");
        if (!product?.githubRepo) {
          return NextResponse.json(
            { error: "This product has no GitHub repository configured" },
            { status: 400 }
          );
        }
        const invite = await inviteCollaborator(product.githubRepo, username);
        if (!invite.ok) {
          return NextResponse.json({ error: invite.error }, { status: 502 });
        }
        license.githubInvited = true;
        license.githubUsername = username;
        license.githubInvitedAt = new Date();
        break;
      }

      case "github_remove": {
        const product = await Product.findById(license.product).select("githubRepo");
        if (product?.githubRepo && license.githubUsername) {
          await removeCollaborator(product.githubRepo, license.githubUsername);
        }
        license.githubInvited = false;
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await license.save();
    return NextResponse.json({ license });
  } catch (error) {
    console.error("PATCH /api/admin/licenses failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
