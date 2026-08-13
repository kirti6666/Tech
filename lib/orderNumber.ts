import mongoose, { Schema, models, model } from "mongoose";

/**
 * Sequential, human-readable order numbers: TB-2026-000142.
 *
 * Uses an atomic $inc on a dedicated counter document rather than
 * counting existing orders. `Order.countDocuments() + 1` looks fine in
 * development and produces duplicates the first time two customers check
 * out in the same second — and by then you have two orders claiming the
 * same number on two GST invoices.
 *
 * Counter resets per financial year to match the invoice numbering
 * already used in lib/invoice/settings.ts.
 */

interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = models.Counter || model<ICounter>("Counter", CounterSchema);

/** Indian financial year label for a date: 2026-27. */
export function financialYearOf(date = new Date()): string {
  const year = date.getFullYear();
  // FY starts 1 April.
  const startYear = date.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export async function generateOrderNumber(date = new Date()): Promise<string> {
  const fy = financialYearOf(date);
  const counter = await Counter.findByIdAndUpdate(
    `order:${fy}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `TB-${fy.slice(0, 4)}-${String(counter.seq).padStart(6, "0")}`;
}

export { Counter };
