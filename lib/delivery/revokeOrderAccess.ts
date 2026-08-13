import License from "@/models/License";
import Product from "@/models/Product";
import Order from "@/models/Order";
import ServiceRequest from "@/models/ServiceRequest";
import { removeCollaborator } from "@/lib/github";

/**
 * Revokes everything an order granted. Called when a refund is issued.
 *
 * Revocation is best-effort by nature — the customer already has the file
 * on their disk, and no amount of code takes it back. What this does is
 * close the ongoing access: no further downloads, no repository access, and
 * a clear record of when and why. That record is what makes the refund
 * policy enforceable if it ever has to be.
 *
 * Deliberately does not delete the licence. An audit trail with holes in it
 * is worse than no audit trail: you need to be able to answer "did this
 * person ever have access, and when did it stop".
 */

export interface RevokeResult {
  licensesRevoked: number;
  githubRemoved: number;
  githubFailures: string[];
  servicesCancelled: number;
}

export async function revokeOrderAccess(
  orderId: string,
  options: { reason: string; byUserId?: string }
): Promise<RevokeResult> {
  const licenses = await License.find({ order: orderId, status: "active" });

  const result: RevokeResult = {
    licensesRevoked: 0,
    githubRemoved: 0,
    githubFailures: [],
    servicesCancelled: 0,
  };

  for (const license of licenses) {
    // Repository access first. If it fails we still revoke the licence —
    // partial revocation beats leaving both open because one call errored.
    if (license.githubInvited && license.githubUsername) {
      const product = await Product.findById(license.product).select("githubRepo");
      if (product?.githubRepo) {
        const removal = await removeCollaborator(
          product.githubRepo,
          license.githubUsername
        );
        if (removal.ok) result.githubRemoved += 1;
        else
          result.githubFailures.push(
            `${license.githubUsername} on ${product.githubRepo}: ${removal.error}`
          );
      }
    }

    license.status = "revoked";
    license.revokedAt = new Date();
    license.revokedReason = options.reason;
    if (options.byUserId) license.revokedBy = options.byUserId as never;
    await license.save();
    result.licensesRevoked += 1;
  }

  // Undelivered service work stops. Work already delivered is left alone —
  // marking a completed rebranding as cancelled would misstate what happened.
  const services = await ServiceRequest.updateMany(
    { order: orderId, status: { $in: ["pending", "in_progress"] } },
    {
      $set: { adminNotes: `Cancelled — order refunded. ${options.reason}` },
      $push: { status: "pending" },
    }
  );
  result.servicesCancelled = services.modifiedCount ?? 0;

  await Order.updateOne(
    { _id: orderId },
    {
      $set: {
        orderStatus: "refunded",
        paymentStatus: "refunded",
        refundedAt: new Date(),
        refundReason: options.reason,
      },
    }
  );

  if (result.githubFailures.length) {
    // Loud, because this is the one part that silently leaves access open.
    console.error(
      `[revoke] Order ${orderId}: GitHub access NOT removed for ${result.githubFailures.join("; ")}`
    );
  }

  return result;
}
