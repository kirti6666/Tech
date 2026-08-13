import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import { requireAuth } from "@/lib/middleware/requireAuth";
import { sendEmail } from "@/lib/email";
import {
  SERVICE_FORMS,
  validateServicePayload,
  maskPayload,
  type ServiceField,
} from "@/lib/services/schemas";
import type { AddonType } from "@/types/catalog";
import { isEncryptionConfigured } from "@/lib/crypto";

/**
 * GET   /api/services/[id] — the customer's own request, secrets masked
 * PATCH /api/services/[id] — submit or update the intake details
 *
 * Ownership is part of every query, never a check afterwards. There is no
 * path here that loads a request without constraining it to the signed-in
 * user's id.
 *
 * Secrets are never returned, not even to the customer who typed them.
 * There's no legitimate need — they know their own password — and a
 * read-back endpoint that decrypts on request is a much larger target than
 * one that only ever writes.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  await connectDB();

  const request = await ServiceRequest.findOne({ _id: params.id, user: user.id })
    .populate("product", "title slug")
    .populate("order", "orderNumber")
    .lean();

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const typed = request as unknown as {
    type: keyof typeof SERVICE_FORMS;
    payload: Record<string, unknown>;
  };

  return NextResponse.json({
    request: { ...typed, payload: maskPayload(typed.type, typed.payload ?? {}) },
    form: SERVICE_FORMS[typed.type],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  try {
    await connectDB();

    const request = await ServiceRequest.findOne({ _id: params.id, user: user.id });
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status === "delivered") {
      return NextResponse.json(
        { error: "This work has already been delivered. Get in touch if something needs changing." },
        { status: 409 }
      );
    }

    const definition = SERVICE_FORMS[request.type as AddonType];
    const needsEncryption = definition.fields.some((f: ServiceField) => f.secret);

    // Refuse rather than store a password in plaintext because a config
    // value is missing. Failing loudly here is recoverable; a database full
    // of unencrypted server credentials is not.
    if (needsEncryption && !isEncryptionConfigured()) {
      console.error(
        "[services] CREDENTIALS_ENCRYPTION_KEY is not set — refusing to store credentials."
      );
      return NextResponse.json(
        { error: "We can't accept these details right now. Please contact support." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const outcome = validateServicePayload(request.type as AddonType, body.payload ?? {});

    if (!outcome.valid) {
      return NextResponse.json(
        { error: "Please check the highlighted fields", fields: outcome.errors },
        { status: 400 }
      );
    }

    const isFirstSubmission = !request.payloadSubmittedAt;

    request.payload = outcome.payload;
    request.payloadSubmittedAt = new Date();
    // Submitting details does not move the request to "in progress" — that's
    // a claim about what the team is doing, and only the team can make it.
    await request.save();

    if (isFirstSubmission && process.env.ADMIN_NOTIFICATION_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `Service details submitted — ${definition.fields.length ? request.type : ""} ${params.id}`,
        html: `<p>A customer has submitted intake details for a <strong>${request.type}</strong> request.</p>
               <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/services/${params.id}">Open it in the admin panel</a></p>`,
      });
    }

    return NextResponse.json({
      ok: true,
      status: request.status,
      payloadSubmittedAt: request.payloadSubmittedAt,
    });
  } catch (error) {
    console.error("PATCH /api/services/[id] failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
