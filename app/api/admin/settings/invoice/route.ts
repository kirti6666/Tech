import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import InvoiceSettings from "@/models/InvoiceSettings";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { logAdminAction, getClientIp } from "@/lib/middleware/logAdminAction";
import { getInvoiceSettings } from "@/lib/invoice/settings";
import { INDIAN_STATES } from "@/lib/states";

/**
 * GET / PUT /api/admin/settings/invoice
 *
 * These values decide what every future tax invoice says. Two guards
 * matter more than the rest:
 *
 * The seller state code must be a real GST code, because it is one half of
 * the intra-state vs inter-state comparison. A blank or invented value
 * silently makes every order look intra-state, and you would be issuing
 * CGST+SGST invoices for supplies that should carry IGST — an error you
 * discover at assessment, long after the invoices are immutable.
 *
 * The invoice number prefix and financial year are NOT editable here.
 * Invoice numbering has to be gapless and sequential under GST rules;
 * exposing a field that lets someone reset the counter mid-year is a
 * compliance problem waiting for a curious afternoon.
 */

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await getInvoiceSettings();
  return NextResponse.json({ settings });
}

const GSTIN_PATTERN =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await req.json();
    const seller = body.seller ?? {};
    const tax = body.tax ?? {};
    const errors: Record<string, string> = {};

    const name = String(seller.name ?? "").trim();
    if (!name) errors["seller.name"] = "The registered company name is required";

    const gstin = String(seller.gstin ?? "").trim().toUpperCase();
    if (gstin && !GSTIN_PATTERN.test(gstin)) {
      errors["seller.gstin"] = "That GSTIN doesn't look valid";
    }

    const stateCode = String(seller.stateCode ?? "").trim();
    if (!stateCode) {
      errors["seller.stateCode"] =
        "Required — without it every order is treated as intra-state";
    } else if (!INDIAN_STATES.some((s) => s.code === stateCode)) {
      errors["seller.stateCode"] = "Not a recognised GST state code";
    } else if (gstin && gstin.slice(0, 2) !== stateCode) {
      // The first two digits of a GSTIN encode the holder's state. If they
      // disagree, one of the two fields is wrong and every invoice would
      // misstate the place of supply.
      errors["seller.gstin"] =
        "This GSTIN belongs to a different state than the one selected";
    }

    const gstRate = Number(tax.defaultGstRate);
    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 28) {
      errors["tax.defaultGstRate"] = "GST rate must be between 0 and 28";
    }

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { error: "Please check the highlighted fields", fields: errors },
        { status: 400 }
      );
    }

    const update = {
      "seller.name": name,
      "seller.legalName": String(seller.legalName ?? name).trim(),
      "seller.gstin": gstin,
      "seller.stateCode": stateCode,
      "seller.address": String(seller.address ?? "").trim(),
      "seller.city": String(seller.city ?? "").trim(),
      "seller.state": String(seller.state ?? "").trim(),
      "seller.pincode": String(seller.pincode ?? "").trim(),
      "seller.email": String(seller.email ?? "").trim(),
      "seller.phone": String(seller.phone ?? "").trim(),
      "tax.gstEnabled": Boolean(tax.gstEnabled),
      "tax.pricesIncludeTax": Boolean(tax.pricesIncludeTax),
      "tax.defaultGstRate": gstRate,
      "tax.defaultHsnCode": String(tax.defaultHsnCode ?? "997331").trim(),
      "tax.roundOffTotal": Boolean(tax.roundOffTotal),
    };

    await InvoiceSettings.findOneAndUpdate({}, { $set: update }, { upsert: true });

    await logAdminAction({
      adminId: admin.id,
      action: "SETTINGS_UPDATE",
      targetType: "Settings",
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/admin/settings/invoice failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
