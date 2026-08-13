import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AddonSettings from "@/models/AddonSettings";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { logAdminAction, getClientIp } from "@/lib/middleware/logAdminAction";
import { getAddons } from "@/lib/addons";
import { ADDON_TYPES } from "@/types/catalog";

/**
 * GET / PUT /api/admin/settings/addons — the three service prices.
 *
 * Changing a price here affects only future orders. Existing orders froze
 * their add-on prices at checkout and invoices are immutable snapshots, so
 * there is no back-propagation to worry about — which is exactly why the
 * prices are safe to edit without a deploy.
 */

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const addons = await getAddons();
  return NextResponse.json({ addons });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await req.json();
    const incoming = Array.isArray(body.addons) ? body.addons : [];

    const cleaned = [];
    for (const addon of incoming) {
      if (!(ADDON_TYPES as readonly string[]).includes(addon.type)) continue;

      const price = Number(addon.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: `${addon.label || addon.type}: price must be a positive number` },
          { status: 400 }
        );
      }

      const gstRate = Number(addon.gstRate);
      if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 28) {
        return NextResponse.json(
          { error: `${addon.label || addon.type}: GST rate looks wrong` },
          { status: 400 }
        );
      }

      cleaned.push({
        type: addon.type,
        label: String(addon.label ?? "").trim().slice(0, 80),
        description: String(addon.description ?? "").trim().slice(0, 400),
        price: Math.round(price),
        sacCode: String(addon.sacCode ?? "997331").trim(),
        gstRate,
        isActive: Boolean(addon.isActive),
        displayOrder: Number(addon.displayOrder) || 0,
      });
    }

    if (cleaned.length === 0) {
      return NextResponse.json({ error: "No valid add-ons supplied" }, { status: 400 });
    }

    await AddonSettings.findOneAndUpdate(
      { singletonKey: "addons" },
      { $set: { addons: cleaned } },
      { upsert: true, new: true }
    );

    await logAdminAction({
      adminId: admin.id,
      action: "SETTINGS_UPDATE",
      targetType: "Settings",
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true, addons: cleaned });
  } catch (error) {
    console.error("PUT /api/admin/settings/addons failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
