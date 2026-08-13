"use client";

import { useState } from "react";

/**
 * Source archive upload, three steps against the Phase 4 endpoints:
 * sign → PUT straight to the bucket → confirm.
 *
 * XMLHttpRequest rather than fetch, purely for `upload.onprogress`. These
 * archives are hundreds of megabytes and a spinner with no percentage on a
 * four-minute upload looks identical to a hang — people cancel and retry,
 * which makes it worse.
 *
 * Nothing is recorded against the product until the confirm step verifies
 * the object actually landed, so an interrupted upload leaves the previous
 * file in place rather than a product pointing at nothing.
 */
export function SourceFileUpload({
  productId,
  fileName,
  fileSize,
  onUploaded,
}: {
  productId: string;
  fileName?: string;
  fileSize?: number;
  onUploaded: (key: string, name: string, size: number) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState({ name: fileName, size: fileSize });

  async function upload(file: File) {
    setError(null);
    setProgress(0);

    try {
      const signResponse = await fetch(`/api/admin/products/${productId}/source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/zip",
        }),
      });
      const signed = await signResponse.json();
      if (!signResponse.ok) {
        setError(signed.error ?? "Could not start the upload.");
        setProgress(null);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/zip");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Storage responded ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      const confirmResponse = await fetch(
        `/api/admin/products/${productId}/source`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: signed.key, filename: file.name }),
        }
      );
      const confirmed = await confirmResponse.json();
      if (!confirmResponse.ok) {
        setError(confirmed.error ?? "The upload didn't complete.");
        setProgress(null);
        return;
      }

      setCurrent({ name: confirmed.sourceFileName, size: confirmed.sourceFileSize });
      onUploaded(
        confirmed.sourceFileKey,
        confirmed.sourceFileName,
        confirmed.sourceFileSize
      );
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setProgress(null);
    }
  }

  return (
    <div className="rounded-lg bg-paper-alt p-4">
      <span className="label-muted">Source archive</span>

      {current.name ? (
        <p className="mt-1.5 text-sm text-ink">
          {current.name}
          {current.size ? (
            <span className="ml-2 tabular text-xs text-ink-faint">
              {(current.size / 1024 / 1024).toFixed(1)} MB
            </span>
          ) : null}
        </p>
      ) : (
        <p className="mt-1.5 text-sm text-ink-faint">
          Nothing attached. This product can&apos;t be published until there is.
        </p>
      )}

      {progress !== null ? (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-rule-lavender">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 tabular text-xs text-ink-faint">
            Uploading… {progress}% — leave this tab open.
          </p>
        </div>
      ) : (
        <label className="btn-secondary mt-3 cursor-pointer">
          {current.name ? "Replace file" : "Choose file"}
          <input
            type="file"
            accept=".zip,.tar,.gz,.rar,.7z"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      )}

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}

      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        Uploads go straight to private storage — the file never passes through
        the server. Customers only ever receive a signed link that expires
        after fifteen minutes.
      </p>
    </div>
  );
}
