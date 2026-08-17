"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle, Replace, Trash2 } from "lucide-react";

interface SingleImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: "square" | "banner" | "cover";
  hint?: string;
}

export function SingleImageUpload({ value, onChange, label, aspect = "square", hint }: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    setError("");
    if (!file.type.startsWith("image/")) return setError("Choose a JPG, PNG, WebP or GIF image.");
    if (file.size > 10 * 1024 * 1024) return setError("The image must be smaller than 10 MB.");
    setUploading(true);
    try {
      const signatureResponse = await fetch("/api/upload", { method: "POST" });
      if (!signatureResponse.ok) {
        const data = await signatureResponse.json().catch(() => ({}));
        throw new Error(data.error || "Could not prepare the upload.");
      }
      const { signature, timestamp, folder, apiKey, cloudName } = await signatureResponse.json();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
      if (!uploadResponse.ok) throw new Error("The image upload failed. Check Cloudinary configuration.");
      const data = await uploadResponse.json();
      onChange(data.secure_url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const previewClass = aspect === "banner" ? "w-full aspect-[16/6]" : aspect === "cover" ? "w-full max-w-lg aspect-[4/3]" : "w-28 aspect-square";
  const chooser = <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={(event) => handleFile(event.target.files)} />;

  return (
    <div>
      {label && <p className="label-muted mb-1.5">{label}</p>}
      {hint && <p className="mb-3 text-xs leading-relaxed text-ink-faint">{hint}</p>}
      {value ? (
        <div className={`group relative overflow-hidden rounded-xl border border-rule bg-paper-alt shadow-card ${previewClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Image preview" className={`h-full w-full object-top ${aspect === "banner" ? "object-contain" : "object-cover"}`} />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 pt-10 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink shadow"><Replace size={14} /> Replace{chooser}</label>
            <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white shadow"><Trash2 size={14} /> Remove</button>
          </div>
        </div>
      ) : (
        <label className={`${previewClass} flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent/35 bg-accent-mist/30 p-6 text-center text-accent-deep transition hover:border-accent hover:bg-accent-mist`}>
          {uploading ? <LoaderCircle size={28} className="animate-spin" /> : <ImagePlus size={28} />}
          <span className="mt-2 text-sm font-bold">{uploading ? "Uploading image…" : "Choose image from gallery"}</span>
          <span className="mt-1 text-xs text-ink-faint">JPG, PNG or WebP · maximum 10 MB</span>
          {chooser}
        </label>
      )}
      {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
