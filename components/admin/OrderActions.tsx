"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Refund control.
 *
 * Two friction points on purpose. A reason is required, because a
 * revocation with no explanation is unreadable six months later — which is
 * exactly when someone asks why a customer lost access. And the confirm
 * step spells out that this does not move money: refunds are issued in the
 * Razorpay or Stripe dashboard, and this records the consequence. An
 * operator who assumes the button also refunds the payment will leave a
 * customer without access and without their money.
 */
export function OrderActions({
  orderId,
  refunded,
  paid,
}: {
  orderId: string;
  refunded: boolean;
  paid: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  if (refunded || !paid) return null;

  async function submit() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not process the refund.");
        return;
      }

      if (data.warning) setWarning(data.warning);
      else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-danger">
        Revoke access
      </button>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl bg-paper p-5 shadow-lift ring-1 ring-red-200">
      <p className="text-sm font-medium text-ink">Revoke access for this order</p>
      <p className="mt-1 text-sm text-ink-soft">
        Licences are revoked, GitHub access removed and undelivered service
        work cancelled. <strong className="font-medium text-ink">This does
        not refund the payment</strong> — issue that in your payment
        dashboard.
      </p>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.06em] text-ink-faint">
          Reason (goes on the licence record)
        </span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="field mt-1"
          placeholder="Customer requested refund within 7-day window"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {warning && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {warning} Access was revoked here, but remove the GitHub collaborator
          by hand.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !reason.trim()}
          className="btn-danger"
        >
          {busy ? "Revoking…" : "Revoke access"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
