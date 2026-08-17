"use client";

import { useState } from "react";
import { LoaderCircle, Replace, Trash2, Upload, Video } from "lucide-react";

interface SingleVideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

export function SingleVideoUpload({ value, onChange, label, hint }: SingleVideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    setError("");

    if (!file.type.startsWith("video/")) {
      setError("Choose an MP4, WebM or MOV video.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("The video must be smaller than 100 MB.");
      return;
    }

    setUploading(true);
    try {
      const signatureResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType: "video" }),
      });
      if (!signatureResponse.ok) {
        const data = await signatureResponse.json().catch(() => ({}));
        throw new Error(data.error || "Could not prepare the video upload.");
      }

      const { signature, timestamp, folder, apiKey, cloudName } = await signatureResponse.json();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadResponse.ok) {
        const data = await uploadResponse.json().catch(() => ({}));
        throw new Error(data?.error?.message || "The video upload failed. Check Cloudinary configuration.");
      }

      const data = await uploadResponse.json();
      onChange(data.secure_url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const chooser = (
    <input
      type="file"
      accept="video/mp4,video/webm,video/quicktime"
      className="hidden"
      disabled={uploading}
      onChange={(event) => handleFile(event.target.files)}
    />
  );

  return (
    <div>
      {label && <p className="label-muted mb-1.5">{label}</p>}
      {hint && <p className="mb-3 text-xs leading-relaxed text-ink-faint">{hint}</p>}
      {value ? (
        <div className="group relative w-full max-w-2xl overflow-hidden rounded-xl border border-rule bg-[#061a3a] shadow-card">
          <video src={value} controls preload="metadata" className="aspect-video w-full bg-black object-contain" />
          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 bg-[#061a3a] p-3">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink shadow">
              <Replace size={14} /> Replace video {chooser}
            </label>
            <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white shadow">
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="flex aspect-video w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent/35 bg-gradient-to-br from-white to-blue-50 p-6 text-center text-accent-deep transition hover:border-accent hover:shadow-card">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-100">
            {uploading ? <LoaderCircle size={25} className="animate-spin" /> : <Video size={25} />}
          </span>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold">
            {!uploading && <Upload size={15} />}{uploading ? "Uploading video to Cloudinary…" : "Choose video from gallery"}
          </span>
          <span className="mt-1 text-xs text-ink-faint">MP4, WebM or MOV · maximum 100 MB</span>
          {chooser}
        </label>
      )}
      {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
