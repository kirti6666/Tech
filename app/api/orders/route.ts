import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { quoteOrder, isValidGstin, gstinMatchesState } from "@/lib/pricing";
import { generateOrderNumber } from "@/lib/orderNumber";
import { stateCodeFor } from "@/lib/invoice/compute";

/**
 * GET  /api/orders — the buyer's own orders (admins see all).
 * POST /api/orders — creates a PENDING order and returns it.
 *
 * POST does not confirm anything. It writes an unpaid order with the
 * server-computed total, and payment is confirmed later by the gateway
 * webhook. Cash on delivery is gone — there is no delivery to collect on.
 *
 * Nothing irreversible happens here: no coupon is spent, no licence is
 * minted, no email is sent. An abandoned checkout leaves a pending order
 * and nothing else.
 */

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));
    const status = searchParams.get("status");

    const filter: Record<string, unknown> =
      user.role === "admin" ? {} : { user: user.id };
    if (status) filter.orderStatus = status;

    let query = Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (user.role === "admin") query = query.populate("user", "name email");

    const [orders, total] = await Promise.all([
      query.lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/orders failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

interface BillingInput {
  name?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const billing: BillingInput = body.billing ?? {};
    const country = (billing.country ?? "IN").toUpperCase();

    const items = Array.isArray(body.items)
      ? body.items
          .filter((i: unknown): i is { productId: string } =>
            Boolean(i && typeof (i as { productId?: unknown }).productId === "string")
          )
          .map((i: { productId: string; packageId?: unknown; addons?: unknown }) => ({
            productId: i.productId,
            packageId: typeof i.packageId === "string" ? i.packageId : undefined,
            addons: Array.isArray(i.addons)
              ? i.addons.filter((a): a is string => typeof a === "string")
              : [],
          }))
      : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    // Field-level validation, so the buyer gets told which box to fix rather
    // than a single "invalid billing details".
    const errors: Record<string, string> = {};
    const required: [keyof BillingInput, string, string][] = [
      ["name", "name", "Enter the name for the invoice"],
      ["email", "email", "Enter an email address"],
      ["phone", "phone", "Enter a phone number"],
      ["addressLine1", "addressLine1", "Enter the billing address"],
      ["city", "city", "Enter a city"],
    ];
    for (const [field, key, message] of required) {
      if (!String(billing[field] ?? "").trim()) errors[key] = message;
    }
    if (billing.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(billing.email.trim())) {
      errors.email = "That email address doesn't look right";
    }

    // State is only meaningful for Indian buyers, but for them it is what
    // decides CGST+SGST versus IGST, so it can't be optional.
    let stateCode = "";
    if (country === "IN") {
      if (!String(billing.state ?? "").trim()) {
        errors.state = "Select a state — it determines how GST is charged";
      } else {
        stateCode = stateCodeFor(billing.state!);
        if (!stateCode) errors.state = "Select a state from the list";
      }
    }

    const gstin = billing.gstin?.trim().toUpperCase();
    if (gstin) {
      if (!isValidGstin(gstin)) {
        errors.gstin = "That GSTIN doesn't look valid";
      } else if (stateCode && !gstinMatchesState(gstin, stateCode)) {
        errors.gstin = "This GSTIN belongs to a different state than the address";
      }
    }

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { error: "Please check the highlighted fields", fields: errors },
        { status: 400 }
      );
    }

    await connectDB();

    // Prices, add-on prices, discount and tax all come from the database.
    // The request body supplies ids and choices only.
    const quote = await quoteOrder({
      items,
      couponCode: typeof body.couponCode === "string" ? body.couponCode : undefined,
      billing: { country, state: billing.state, stateCode, gstin },
    });

    if (quote.items.length === 0) {
      return NextResponse.json(
        { error: "Nothing in your cart is available to buy any more" },
        { status: 400 }
      );
    }

    const order = await Order.create({
      user: user.id,
      orderNumber: await generateOrderNumber(),
      items: quote.items.map((item) => ({
        product: item.productId,
        title: item.title,
        slug: item.slug,
        image: item.image,
        packageId: item.packageId,
        packageName: item.packageName,
        price: item.price,
        sacCode: item.sacCode,
        gstRate: item.gstRate,
      })),
      addons: quote.addons.map((addon) => ({
        type: addon.type,
        label: addon.label,
        price: addon.price,
        product: addon.productId,
      })),
      billing: {
        name: billing.name!.trim(),
        email: billing.email!.trim().toLowerCase(),
        phone: billing.phone!.trim(),
        addressLine1: billing.addressLine1!.trim(),
        addressLine2: billing.addressLine2?.trim(),
        city: billing.city!.trim(),
        state: (billing.state ?? "").trim(),
        stateCode,
        pincode: billing.pincode?.trim(),
        country,
        gstin,
      },
      subtotal: quote.subtotal + quote.addonTotal,
      discount: quote.discount,
      couponCode: quote.couponCode,
      taxTotal: quote.taxTotal,
      total: quote.total,
      currency: quote.currency,
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    return NextResponse.json(
      {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          currency: order.currency,
        },
        quote,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
