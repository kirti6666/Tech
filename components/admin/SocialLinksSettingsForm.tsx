"use client";

import { FormEvent, useState } from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import type { SiteSettingsData } from "@/lib/site-settings";

const FIELDS = [
  { key: "instagram" as const, label: "Instagram", placeholder: "https://instagram.com/techbro", Icon: Instagram },
  { key: "facebook" as const, label: "Facebook", placeholder: "https://facebook.com/techbro", Icon: Facebook },
  { key: "linkedin" as const, label: "LinkedIn", placeholder: "https://linkedin.com/company/techbro", Icon: Linkedin },
];

export function SocialLinksSettingsForm({ initial }: { initial: SiteSettingsData }) {
  const [settings, setSettings] = useState(initial);
  const [social, setSocial] = useState(initial.social);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const currentResponse = await fetch("/api/settings", { cache: "no-store" });
      const currentData = (await currentResponse.json()) as { settings?: SiteSettingsData };
      const latest = currentData.settings ?? settings;
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...latest, social: { ...latest.social, ...social } }),
      });
      const data = (await response.json()) as { error?: string; settings?: SiteSettingsData };
      if (!response.ok) throw new Error(data.error || "Could not save social links.");
      if (data.settings) {
        setSettings(data.settings);
        setSocial(data.settings.social);
      }
      setMessage("Social links saved. The footer and mobile menu are updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save social links.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card mb-6 overflow-hidden">
      <div className="panel-head">
        <h2 className="text-sm font-semibold text-ink">Social media</h2>
        <p className="mt-1 text-xs text-ink-faint">These links appear in the full-screen mobile menu and website footer. Leave a field empty to hide that icon.</p>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-3">
        {FIELDS.map(({ key, label, placeholder, Icon }) => (
          <label key={key} className="block text-xs font-bold text-ink">
            <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-accent" />{label}</span>
            <input
              type="url"
              value={social[key]}
              onChange={(event) => setSocial((current) => ({ ...current, [key]: event.target.value }))}
              className="field mt-2"
              placeholder={placeholder}
            />
          </label>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-3">
          <p className={`text-xs ${message.startsWith("Social") ? "text-save" : "text-red-600"}`} role="status">{message}</p>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save social links"}
          </button>
        </div>
      </div>
    </form>
  );
}
