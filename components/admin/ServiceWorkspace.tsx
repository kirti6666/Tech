"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceField } from "@/lib/services/schemas";
import type { ServiceStatus } from "@/types/catalog";

/**
 * The screen an engineer works a request from.
 *
 * Credentials are masked on load and only fetched in plaintext when someone
 * presses Reveal, which fires a separate request that writes an audit
 * entry. Two reasons that button exists rather than the page just showing
 * them: an audit log that records every page view tells you nothing, and a
 * password sitting on screen while you share it in a call is a leak waiting
 * to happen.
 *
 * Marking the work delivered purges the stored credentials immediately
 * rather than waiting for the retention job. The moment the work is done is
 * the moment they stop being needed.
 */

const STATUSES: { value: ServiceStatus; label: string; hint: string }[] = [
  { value: "pending", label: "Pending", hint: "Queued, nobody working on it" },
  { value: "in_progress", label: "In progress", hint: "Someone has picked it up" },
  { value: "delivered", label: "Delivered", hint: "Done — credentials are purged" },
];

export function ServiceWorkspace({
  requestId,
  fields,
  initialPayload,
  initialStatus,
  initialNotes,
  hasCredentials,
  credentialsPurged,
}: {
  requestId: string;
  fields: ServiceField[];
  initialPayload: Record<string, unknown>;
  initialStatus: ServiceStatus;
  initialNotes: string;
  hasCredentials: boolean;
  credentialsPurged: boolean;
}) {
  const router = useRouter();
  const [payload, setPayload] = useState(initialPayload);
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function reveal() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/services/${requestId}?reveal=1`
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not load the credentials.");
        return;
      }
      setPayload(data.request.payload);
      setRevealed(true);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function save(nextStatus?: ServiceStatus) {
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(`/api/admin/services/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus ?? status,
          adminNotes: notes,
          note: note.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }

      if (nextStatus) setStatus(nextStatus);
      setNote("");
      setSaved(true);

      // Delivering purges the secrets server-side, so what's on screen is
      // now stale. Drop it rather than leave a plaintext password in a
      // component that no longer reflects the database.
      if (nextStatus === "delivered") {
        setRevealed(false);
        router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-5">
        <section className="card overflow-hidden">
          <div className="panel-head flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Customer details</h2>
            {hasCredentials && !credentialsPurged && !revealed && (
              <button
                type="button"
                onClick={reveal}
                disabled={busy}
                className="text-xs font-medium text-accent-deep hover:underline"
              >
                Reveal credentials
              </button>
            )}
            {revealed && (
              <span className="inline-flex rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                Credentials visible — this was logged
              </span>
            )}
          </div>

          <dl className="divide-y divide-rule-soft">
            {fields.map((field) => {
              const value = payload[field.name];
              if (value === undefined || value === "") return null;

              return (
                <div
                  key={field.name}
                  className="grid grid-cols-[9rem_1fr] gap-4 px-5 py-3"
                >
                  <dt className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                    {field.label}
                  </dt>
                  <dd
                    className={`break-words text-sm ${
                      field.secret ? "font-mono text-ink" : "text-ink"
                    }`}
                  >
                    {field.type === "color" ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block h-4 w-4 rounded ring-1 ring-rule"
                          style={{ background: String(value) }}
                        />
                        <span className="font-mono">{String(value)}</span>
                      </span>
                    ) : (
                      String(value)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          {credentialsPurged && (
            <p className="border-t border-rule-soft px-5 py-3 text-xs text-ink-faint">
              Credentials for this request have been deleted. The rest of the
              record is kept.
            </p>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="panel-head">
            <h2 className="text-sm font-medium text-ink">Internal notes</h2>
          </div>
          <div className="px-5 py-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="field"
              placeholder="What's been done, what's blocked, who's on it."
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Only visible in this panel — never sent to the customer.
            </p>
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="card overflow-hidden">
          <div className="panel-head">
            <h2 className="text-sm font-medium text-ink">Status</h2>
          </div>
          <div className="space-y-2 px-5 py-4">
            {STATUSES.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer gap-2.5 rounded-lg p-2 hover:bg-paper-alt"
              >
                <input
                  type="radio"
                  name="status"
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                  className="mt-1 accent-accent-deep"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {option.label}
                  </span>
                  <span className="block text-xs text-ink-faint">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}

            <label className="block pt-2">
              <span className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                Note to the customer
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="field mt-1"
                placeholder="Optional — included in the status email."
              />
            </label>

            <button
              type="button"
              onClick={() => save(status)}
              disabled={busy}
              className="btn-primary w-full"
            >
              {busy ? "Saving…" : "Save and notify"}
            </button>

            {error && <p className="text-sm text-red-700">{error}</p>}
            {saved && (
              <p className="text-sm text-emerald-700">
                Saved. The customer has been emailed.
              </p>
            )}

            <p className="pt-1 text-xs text-ink-faint">
              A status change emails the customer. Editing notes alone
              doesn&apos;t.
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}
