"use client";

import { FormEvent, useState } from "react";
import type { SiteSettingsData } from "@/lib/site-settings";

export function TrustedBrandsSettingsForm({ initial }: { initial: SiteSettingsData }) {
  const [settings, setSettings] = useState(initial);
  const [value, setValue] = useState(initial.home.trustedBrands.join("\n"));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const trustedBrands = value
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 30);

    try {
      const currentResponse = await fetch("/api/settings", { cache: "no-store" });
      const currentData = (await currentResponse.json()) as { settings?: SiteSettingsData };
      const latest = currentData.settings ?? settings;
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...latest,
          home: { ...latest.home, trustedBrands },
        }),
      });
      const data = (await response.json()) as { error?: string; settings?: SiteSettingsData };
      if (!response.ok) throw new Error(data.error || "Could not save company names.");

      if (data.settings) setSettings(data.settings);
      setValue(trustedBrands.join("\n"));
      setMessage("Company names saved. The homepage marquee is updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save company names.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card mb-6 overflow-hidden">
      <div className="panel-head">
        <h2 className="text-sm font-semibold text-ink">Trusted companies marquee</h2>
        <p className="mt-1 text-xs text-ink-faint">Enter one company name per line. These names move continuously below the homepage hero.</p>
      </div>
      <div className="p-5">
        <label htmlFor="trusted-brands" className="text-xs font-bold text-ink">Company names</label>
        <textarea
          id="trusted-brands"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={8}
          maxLength={2400}
          className="field mt-2 resize-y"
          placeholder={"BluePeak Realty\nNorthfield School Group\nKavya Foods Co."}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-xs ${message.startsWith("Company") ? "text-save" : "text-red-600"}`} role="status">{message}</p>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save company names"}
          </button>
        </div>
      </div>
    </form>
  );
}
