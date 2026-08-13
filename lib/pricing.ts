import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import { getAddons, isAddonType, type AddonOffer } from "@/lib/addons";
import { getInvoiceSettings } from "@/lib/invoice/settings";
import { stateCodeFor } from "@/lib/invoice/compute";
import { effectivePrice } from "@/lib/product";
import type { AddonType } from "@/types/catalog";

/**
 * The single place an order total is calculated.
 *
 * Every price, every add-on price, and the discount are re-derived from the
 * database here. The client sends product ids and a list of ticked add-ons —
 * never an amount. The quote endpoint, order creation and the Razorpay
 * create-order route all call this same function, so the number shown in the
 * cart, the number stored on the order and the number charged by the gateway
 * cannot drift apart.
 *
 * GST rules implemented:
 *  - Buyer outside India → export of services, zero-rated under LUT. No GST
 *    is charged and the invoice carries the export declaration.
 *  - Buyer in the seller's state → CGST + SGST at half the rate each.
 *  - Buyer in another state → IGST at the full rate.
 *  - Rate is per line (product.gstRate, addon.gstRate), not one global rate,
 *    because a product could legitimately fall under a different SAC later.
 *
 * `pricesIncludeTax` is read from InvoiceSettings rather than hardcoded, so
 * the charging engine and the invoice engine can never disagree about
 * whether ₹59,999 is inclusive or exclusive of tax. For TechBro it should be
 * set to FALSE — these are B2B prices quoted ex-GST, and the product page
 * says "plus 18% GST".
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface QuoteLineInput {
  productId: string;
  packageId?: string;
  /** Add-ons ticked against this product. */
  addons?: string[];
}

export interface QuoteInput {
  items: QuoteLineInput[];
  couponCode?: string;
  billing?: {
    country?: string;
    state?: string;
    stateCode?: string;
    gstin?: string;
  };
}

export interface QuoteLine {
  productId: string;
  title: string;
  slug: string;
  image?: string;
  packageId?: string;
  packageName?: string;
  price: number;
  sacCode: string;
  gstRate: number;
}

export interface QuoteAddon {
  type: AddonType;
  label: string;
  price: number;
  sacCode: string;
  gstRate: number;
  productId?: string;
  productTitle?: string;
}

export interface Quote {
  items: QuoteLine[];
  addons: QuoteAddon[];
  subtotal: number;
  addonTotal: number;
  discount: number;
  couponCode?: string;
  couponError?: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  total: number;
  currency: "INR";
  taxTreatment: "intra_state" | "inter_state" | "export" | "none";
  placeOfSupply?: string;
  /** Non-fatal problems the buyer needs to see, e.g. a product went offline. */
  warnings: string[];
}

export async function quoteOrder(input: QuoteInput): Promise<Quote> {
  await connectDB();

  const warnings: string[] = [];
  const productIds = Array.from(
    new Set(input.items.map((i) => i.productId).filter(Boolean))
  );

  const [products, addonCatalogue, invoiceSettings] = await Promise.all([
    Product.find({ _id: { $in: productIds }, status: "published" })
      .select("title slug price discountPrice packages images thumbnail sacCode gstRate")
      .lean(),
    getAddons(),
    getInvoiceSettings(),
  ]);

  const productById = new Map(
    (products as Record<string, unknown>[]).map((p) => [String(p._id), p])
  );
  const addonByType = new Map<string, AddonOffer>(
    addonCatalogue.map((a: AddonOffer) => [a.type, a] as const)
  );

  const items: QuoteLine[] = [];
  const addons: QuoteAddon[] = [];

  for (const line of input.items) {
    const product = productById.get(line.productId);
    if (!product) {
      // Unpublished between adding to cart and checking out. Drop the line
      // and say so, rather than failing the whole checkout — the buyer can
      // still pay for the rest.
      warnings.push("A product in your cart is no longer available and was removed.");
      continue;
    }

    const packages = (product.packages as Array<{
      id: string;
      name: string;
      price: number;
    }>) ?? [];
    const selectedPackage = line.packageId
      ? packages.find((item) => item.id === line.packageId)
      : undefined;
    if (line.packageId && !selectedPackage) {
      warnings.push(`The selected package for ${String(product.title)} is unavailable; the base package was used.`);
    }
    const price = selectedPackage
      ? Number(selectedPackage.price)
      : effectivePrice(product as { price: number; discountPrice?: number });

    items.push({
      productId: String(product._id),
      title: String(product.title),
      slug: String(product.slug),
      image:
        (product.thumbnail as string) ||
        ((product.images as string[]) ?? [])[0],
      packageId: selectedPackage?.id,
      packageName: selectedPackage?.name,
      price: round2(price),
      sacCode: String(product.sacCode ?? ""),
      gstRate: Number(product.gstRate ?? 18),
    });

    for (const requested of line.addons ?? []) {
      if (!isAddonType(requested)) continue;
      const offer = addonByType.get(requested);
      if (!offer || !offer.isActive) {
        warnings.push("A selected service is no longer offered and was removed.");
        continue;
      }
      addons.push({
        type: offer.type,
        label: offer.label,
        price: round2(offer.price),
        sacCode: offer.sacCode,
        gstRate: Number(offer.gstRate ?? 18),
        productId: String(product._id),
        productTitle: String(product.title),
      });
    }
  }

  const subtotal = round2(items.reduce((sum, i) => sum + i.price, 0));
  const addonTotal = round2(addons.reduce((sum, a) => sum + a.price, 0));

  // --- Coupon ------------------------------------------------------------
  // Applies to the product subtotal only. Services are priced on the hours
  // they cost you; a percentage coupon that also discounts them turns a
  // marketing offer into a loss on delivered work.
  let discount = 0;
  let appliedCouponCode: string | undefined;
  let couponError: string | undefined;

  if (input.couponCode?.trim()) {
    const code = input.couponCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code });

    if (!coupon || !coupon.isActive) {
      couponError = "That coupon code isn't valid.";
    } else if (coupon.expiresAt < new Date()) {
      couponError = "That coupon has expired.";
    } else if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      couponError = "That coupon has been fully redeemed.";
    } else if (subtotal < coupon.minOrderValue) {
      couponError = `This coupon needs an order of at least ₹${coupon.minOrderValue.toLocaleString("en-IN")}.`;
    } else {
      discount =
        coupon.discountType === "percent"
          ? round2((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal);
      appliedCouponCode = coupon.code;
    }
  }

  // --- Tax treatment -----------------------------------------------------
  const country = (input.billing?.country ?? "IN").toUpperCase();
  const buyerStateCode =
    input.billing?.stateCode?.trim() || stateCodeFor(input.billing?.state ?? "");
  const sellerStateCode = String(invoiceSettings.seller.stateCode || "").trim();
  const gstEnabled = invoiceSettings.tax.gstEnabled;
  const inclusive = invoiceSettings.tax.pricesIncludeTax;

  let taxTreatment: Quote["taxTreatment"];
  if (!gstEnabled) {
    taxTreatment = "none";
  } else if (country !== "IN") {
    // Export of services. Zero-rated under LUT — see the note in
    // PHASE-3-NOTES before the first international order.
    taxTreatment = "export";
  } else if (buyerStateCode && sellerStateCode && buyerStateCode !== sellerStateCode) {
    taxTreatment = "inter_state";
  } else {
    // Unknown state falls back to intra-state: if we can't prove the supply
    // crossed a border, we must not claim it did.
    taxTreatment = "intra_state";
  }

  const chargeable = [
    ...items.map((i) => ({ amount: i.price, rate: i.gstRate })),
    ...addons.map((a) => ({ amount: a.price, rate: a.gstRate })),
  ];

  // Apportion the discount across chargeable lines by value, so each line's
  // taxable value reflects what was actually paid for it.
  const grossTotal = round2(chargeable.reduce((s, l) => s + l.amount, 0));

  let taxableValue = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let allocatedDiscount = 0;

  chargeable.forEach((line, index) => {
    const isLast = index === chargeable.length - 1;
    const share = isLast
      ? round2(discount - allocatedDiscount)
      : grossTotal > 0
        ? round2((discount * line.amount) / grossTotal)
        : 0;
    allocatedDiscount = round2(allocatedDiscount + share);

    const net = round2(line.amount - share);
    const rate = taxTreatment === "none" || taxTreatment === "export" ? 0 : line.rate;

    let lineTaxable: number;
    let lineTax: number;
    if (rate <= 0) {
      lineTaxable = net;
      lineTax = 0;
    } else if (inclusive) {
      lineTaxable = round2((net * 100) / (100 + rate));
      lineTax = round2(net - lineTaxable);
    } else {
      lineTaxable = net;
      lineTax = round2((net * rate) / 100);
    }

    taxableValue = round2(taxableValue + lineTaxable);
    if (taxTreatment === "inter_state") {
      igst = round2(igst + lineTax);
    } else {
      const half = round2(lineTax / 2);
      cgst = round2(cgst + half);
      sgst = round2(sgst + half);
    }
  });

  const taxTotal = round2(cgst + sgst + igst);
  const beforeRounding = round2(taxableValue + taxTotal);
  const total = invoiceSettings.tax.roundOffTotal
    ? Math.round(beforeRounding)
    : beforeRounding;

  return {
    items,
    addons,
    subtotal,
    addonTotal,
    discount,
    couponCode: appliedCouponCode,
    couponError,
    taxableValue,
    cgst,
    sgst,
    igst,
    taxTotal,
    total,
    currency: "INR",
    taxTreatment,
    placeOfSupply: input.billing?.state || undefined,
    warnings: Array.from(new Set(warnings)),
  };
}

/** GSTIN format check. Not a government lookup — shape only. */
export function isValidGstin(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    gstin.trim().toUpperCase()
  );
}

/**
 * A GSTIN encodes the holder's state in its first two digits. If it
 * disagrees with the state on the billing address, one of them is wrong and
 * the invoice would claim the wrong place of supply.
 */
export function gstinMatchesState(gstin: string, stateCode: string): boolean {
  return gstin.trim().slice(0, 2) === stateCode.padStart(2, "0");
}
