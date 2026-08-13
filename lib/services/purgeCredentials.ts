import ServiceRequest from "@/models/ServiceRequest";
import { SERVICE_FORMS } from "@/lib/services/schemas";
import { isEncrypted } from "@/lib/crypto";
import type { AddonType } from "@/types/catalog";

/**
 * Deletes stored credentials once the work they were for is done.
 *
 * This is the part that actually protects customers. Encryption covers the
 * window where you legitimately need a password; deletion is what stops
 * that window being "forever". Without this job, a year from now the
 * database holds live server credentials for every deployment you've ever
 * shipped — a breach that grows in blast radius every month you operate.
 *
 * What goes: only the fields declared `secret` in the service definition.
 * The domain, the hosting provider, the notes — the record of what work was
 * done — all stay, because you need that history for support and for
 * anyone asking what you did.
 *
 * `payloadPurgedAt` records that a purge happened, so an empty credential
 * field reads as "deleted on this date" rather than "the customer never
 * filled it in".
 */

export const CREDENTIAL_RETENTION_DAYS = 7;

/** Strips secrets from one request. Called on delivery and from the job. */
export async function purgeRequestCredentials(requestId: string): Promise<boolean> {
  const request = await ServiceRequest.findById(requestId);
  if (!request) return false;

  const secretFields = SERVICE_FORMS[request.type as AddonType].fields
    .filter((field) => field.secret)
    .map((field) => field.name);

  if (secretFields.length === 0) return false;

  const payload = { ...(request.payload as Record<string, unknown>) };
  let removed = 0;

  for (const name of secretFields) {
    if (payload[name] !== undefined) {
      delete payload[name];
      removed += 1;
    }
  }

  if (removed === 0) return false;

  request.payload = payload;
  request.payloadPurgedAt = new Date();
  await request.save();

  return true;
}

export interface PurgeSummary {
  scanned: number;
  purged: number;
  errors: string[];
}

/**
 * Sweeps everything delivered longer ago than the retention window.
 *
 * The per-request purge on delivery handles the normal path; this is the
 * backstop for requests delivered before this job existed, ones where the
 * inline purge failed, and anything marked delivered directly in the
 * database. Safe to run repeatedly — a request with no secrets left is a
 * no-op.
 */
export async function purgeExpiredCredentials(): Promise<PurgeSummary> {
  const cutoff = new Date(
    Date.now() - CREDENTIAL_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const candidates = await ServiceRequest.find({
    status: "delivered",
    deliveredAt: { $lt: cutoff },
    payloadPurgedAt: { $exists: false },
  }).select("_id type");

  const summary: PurgeSummary = {
    scanned: candidates.length,
    purged: 0,
    errors: [],
  };

  for (const candidate of candidates) {
    try {
      const purged = await purgeRequestCredentials(candidate._id.toString());
      if (purged) summary.purged += 1;
      else {
        // Nothing secret to remove, but mark it so the sweep doesn't keep
        // picking the same rows up forever.
        await ServiceRequest.updateOne(
          { _id: candidate._id },
          { $set: { payloadPurgedAt: new Date() } }
        );
      }
    } catch (error) {
      summary.errors.push(`${candidate._id}: ${String(error)}`);
    }
  }

  return summary;
}

/**
 * Abandoned requests: paid, credentials handed over, then nothing for a
 * long time. These are the most dangerous rows in the database — live
 * credentials attached to work nobody is doing. Surfaced for a human rather
 * than purged automatically, because the customer may still be waiting.
 */
export async function findStaleCredentialRequests(daysStale = 60) {
  const cutoff = new Date(Date.now() - daysStale * 24 * 60 * 60 * 1000);

  return ServiceRequest.find({
    status: { $in: ["pending", "in_progress"] },
    payloadSubmittedAt: { $lt: cutoff },
    payloadPurgedAt: { $exists: false },
  })
    .select("_id type user order payloadSubmittedAt")
    .lean();
}
