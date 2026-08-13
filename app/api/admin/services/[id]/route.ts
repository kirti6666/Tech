import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { logAdminAction, getClientIp } from "@/lib/middleware/logAdminAction";
import { sendEmail } from "@/lib/email";
import {
  SERVICE_FORMS,
  maskPayload,
  revealPayload,
  hasSecrets,
} from "@/lib/services/schemas";
import { serviceStatusEmail } from "@/lib/services/notifications";
import { purgeRequestCredentials } from "@/lib/services/purgeCredentials";
import { SERVICE_STATUSES, type AddonType, type ServiceStatus } from "@/types/catalog";

/**
 * GET   /api/admin/services/[id]        — masked by default
 * GET   /api/admin/services/[id]?reveal=1 — decrypts, and logs that it did
 * PATCH /api/admin/services/[id]        — status, assignment, notes, purge
 *
 * Reveal is a separate, explicit request rather than the default, and it
 * writes an audit entry every time. Reading a customer's server password
 * should be a deliberate act that leaves a trace — if it happens by simply
 * opening a page, the log tells you nothing and nobody thinks twice about
 * it.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const doc = await ServiceRequest.findById(params.id)
    .populate("user", "name email")
    .populate("product", "title slug")
    .populate("order", "orderNumber total")
    .lean();

  if (!doc) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const typed = doc as unknown as {
    type: AddonType;
    payload: Record<string, unknown>;
  };

  const reveal = req.nextUrl.searchParams.get("reveal") === "1";
  const payload = typed.payload ?? {};

  if (reveal && hasSecrets(payload)) {
    await logAdminAction({
      adminId: admin.id,
      action: "SERVICE_CREDENTIALS_REVEAL",
      targetType: "ServiceRequest",
      targetId: params.id,
      ipAddress: getClientIp(req),
    });
  }

  return NextResponse.json({
    request: {
      ...typed,
      payload: reveal ? revealPayload(payload) : maskPayload(typed.type, payload),
    },
    form: SERVICE_FORMS[typed.type],
    revealed: reveal,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const request = await ServiceRequest.findById(params.id).populate(
      "user",
      "name email"
    );
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const body = await req.json();
    let statusChanged = false;

    if (body.status) {
      const status = body.status as ServiceStatus;
      if (!(SERVICE_STATUSES as readonly string[]).includes(status)) {
        return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      }

      if (status !== request.status) {
        request.status = status;
        request.history.push({
          status,
          at: new Date(),
          by: admin.id as never,
          note: body.note,
        });
        statusChanged = true;

        if (status === "delivered") {
          request.deliveredAt = new Date();
        }
      }
    }

    if (typeof body.adminNotes === "string") {
      request.adminNotes = body.adminNotes;
    }
    if (body.assignedTo !== undefined) {
      request.assignedTo = body.assignedTo || undefined;
    }

    await request.save();

    // Delivering the work is the moment the credentials stop being needed.
    // Purging immediately, rather than waiting for the retention job, keeps
    // the window as short as the work actually requires.
    if (request.status === "delivered" && body.purgeCredentials !== false) {
      await purgeRequestCredentials(request._id.toString());
    }

    if (statusChanged) {
      const customer = request.user as unknown as { name?: string; email?: string };
      if (customer?.email) {
        await sendEmail({
          to: customer.email,
          subject: `Your ${request.type} request — ${request.status === "delivered" ? "delivered" : "update"}`,
          html: serviceStatusEmail({
            customerName: customer.name ?? "there",
            type: request.type,
            status: request.status,
            note: body.note,
            requestId: request._id.toString(),
          }),
        });
      }
    }

    await logAdminAction({
      adminId: admin.id,
      action: "SERVICE_UPDATE",
      targetType: "ServiceRequest",
      targetId: params.id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true, status: request.status });
  } catch (error) {
    console.error("PATCH /api/admin/services/[id] failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
