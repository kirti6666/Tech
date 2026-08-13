import mongoose from "mongoose";
import License from "@/models/License";
import ServiceRequest from "@/models/ServiceRequest";
import { generateUniqueLicenseKey } from "@/lib/licenseKey";

/**
 * Turns a paid order into entitlements.
 *
 * Called once from confirmPayment, after the atomic pending→paid
 * transition. That transition is the primary idempotency guarantee; the
 * duplicate-key handling here is the second line of defence, because
 * "primary guarantee plus nothing" is how you find out the guarantee had a
 * hole in it — by emailing a customer two licence keys.
 *
 * MongoDB error code 11000 is a duplicate key. On the compound unique index
 * License { order, product } it means this order already has a licence for
 * this product, which means delivery already ran. That is a success, not a
 * failure: we fetch the existing licence and carry on.
 */

export interface IssuedLicense {
  id: string;
  key: string;
  productId: string;
  productTitle: string;
  alreadyExisted: boolean;
}

interface DeliverableOrder {
  _id: unknown;
  user: unknown;
  items: { product: unknown; title: string }[];
  addons?: { type: string; product?: unknown }[];
}

export async function issueLicenses(
  order: DeliverableOrder
): Promise<IssuedLicense[]> {
  const issued: IssuedLicense[] = [];

  for (const item of order.items) {
    try {
      const license = await License.create({
        key: await generateUniqueLicenseKey(),
        order: order._id,
        user: order.user,
        product: item.product,
      });

      issued.push({
        id: license._id.toString(),
        key: license.key,
        productId: String(item.product),
        productTitle: item.title,
        alreadyExisted: false,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const existing = await License.findOne({
          order: order._id,
          product: item.product,
        });
        if (existing) {
          issued.push({
            id: existing._id.toString(),
            key: existing.key,
            productId: String(item.product),
            productTitle: item.title,
            alreadyExisted: true,
          });
          continue;
        }
      }
      // Anything else is real. Rethrow so the webhook returns non-2xx and
      // the gateway retries — a paid order with no licence must not be
      // quietly acknowledged.
      throw error;
    }
  }

  if (issued.length) {
    await mongoose
      .model("Order")
      .updateOne(
        { _id: order._id },
        {
          $set: {
            licenses: issued.map((l) => new mongoose.Types.ObjectId(l.id)),
            deliveredAt: new Date(),
          },
        }
      );
  }

  return issued;
}

/**
 * Opens a work item per purchased service.
 *
 * Created empty and pending: the customer has paid, so the obligation
 * exists whether or not they have filled in the intake form yet. A pending
 * request with an empty payload is "chase the customer"; one with a full
 * payload is "do the work".
 *
 * Idempotent on the same (order, type, product) triple. There is no unique
 * index for this — a buyer could legitimately order rebranding for two
 * different products on one order — so it checks first. The window between
 * check and insert is covered by confirmPayment's atomic transition; the
 * worst case here is a duplicate work item, which is visible and fixable,
 * unlike a duplicate licence.
 */
export async function createServiceRequests(
  order: DeliverableOrder
): Promise<number> {
  const addons = order.addons ?? [];
  let created = 0;

  for (const addon of addons) {
    const exists = await ServiceRequest.exists({
      order: order._id,
      type: addon.type,
      product: addon.product ?? null,
    });
    if (exists) continue;

    await ServiceRequest.create({
      order: order._id,
      user: order.user,
      product: addon.product,
      type: addon.type,
      status: "pending",
      payload: {},
      history: [{ status: "pending", at: new Date() }],
    });
    created += 1;
  }

  return created;
}
