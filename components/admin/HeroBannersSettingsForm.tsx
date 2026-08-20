"use client";

import { FormEvent, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import type { Banner, SiteSettingsData } from "@/lib/site-settings";
import { DEFAULT_HERO_BANNERS } from "@/components/storefront/HomeHeroSlider";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";

const EMPTY_BANNER: Banner = { image: "", heading: "", subheading: "", link: "" };

export function HeroBannersSettingsForm({ initial }: { initial: SiteSettingsData }) {
  const [settings, setSettings] = useState(initial);
  const [banners, setBanners] = useState<Banner[]>(
    initial.home.banners.length > 0
      ? initial.home.banners
      : DEFAULT_HERO_BANNERS.map((banner) => ({ ...banner }))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function update(index: number, patch: Partial<Banner>) {
    setBanners((current) => current.map((banner, bannerIndex) => bannerIndex === index ? { ...banner, ...patch } : banner));
  }

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= banners.length) return;
    setBanners((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const complete = banners.filter((banner) => banner.image.trim()).slice(0, 6);
    if (complete.length === 0) {
      setIsError(true);
      setMessage("Add at least one banner image before saving.");
      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);
    try {
      const currentResponse = await fetch("/api/settings", { cache: "no-store" });
      const currentData = (await currentResponse.json()) as { settings?: SiteSettingsData };
      const latest = currentData.settings ?? settings;
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...latest,
          home: { ...latest.home, banners: complete },
        }),
      });
      const data = (await response.json()) as { error?: string; settings?: SiteSettingsData };
      if (!response.ok) throw new Error(data.error || "Could not save homepage banners.");

      if (data.settings) setSettings(data.settings);
      setBanners(complete);
      setMessage("Homepage banners saved. Refresh the storefront to see them.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not save homepage banners.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card mb-6 overflow-hidden">
      <div className="panel-head flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Homepage hero banners</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-faint">Upload hero images from your gallery. The order below controls the mobile and tablet slideshow. Recommended ratio: 3:2, up to 6 images.</p>
        </div>
        <button type="button" disabled={banners.length >= 6} onClick={() => setBanners((current) => [...current, { ...EMPTY_BANNER }])} className="btn-secondary min-h-9 gap-1.5 px-3 py-2 text-xs">
          <Plus size={14} /> Add banner
        </button>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {banners.map((banner, index) => (
          <article key={`${banner.image}-${index}`} className="rounded-2xl border border-rule-soft bg-paper-alt/70 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent-deep">Banner {index + 1}</p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move banner ${index + 1} up`} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-ink-soft ring-1 ring-rule transition hover:text-accent disabled:opacity-35"><ArrowUp size={14} /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === banners.length - 1} aria-label={`Move banner ${index + 1} down`} className="grid h-8 w-8 place-items-center rounded-lg bg-white text-ink-soft ring-1 ring-rule transition hover:text-accent disabled:opacity-35"><ArrowDown size={14} /></button>
                <button type="button" onClick={() => setBanners((current) => current.filter((_, bannerIndex) => bannerIndex !== index))} aria-label={`Delete banner ${index + 1}`} className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"><Trash2 size={14} /></button>
              </div>
            </div>

            <SingleImageUpload
              value={banner.image}
              onChange={(image) => update(index, { image })}
              aspect="banner"
              hint="Choose a JPG, PNG or WebP banner. The full image is displayed in the mobile and tablet hero slider."
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-ink">Image description
                <input value={banner.heading} onChange={(event) => update(index, { heading: event.target.value })} className="field mt-1.5" maxLength={120} placeholder="Describe the banner for accessibility" />
              </label>
              <label className="text-xs font-bold text-ink">Click destination <span className="font-normal text-ink-faint">(optional)</span>
                <input value={banner.link} onChange={(event) => update(index, { link: event.target.value })} className="field mt-1.5" maxLength={300} placeholder="/shop or https://..." />
              </label>
            </div>
          </article>
        ))}

        {banners.length === 0 && (
          <button type="button" onClick={() => setBanners([{ ...EMPTY_BANNER }])} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-5 py-10 text-accent-deep">
            <ImagePlus size={28} /><span className="mt-2 text-sm font-bold">Add your first banner</span>
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule-soft pt-4">
          <p className={`text-xs ${isError ? "text-red-700" : "text-save"}`} role="status">{message}</p>
          <button type="submit" disabled={saving} className="btn-primary gap-2">
            <Save size={15} /> {saving ? "Saving…" : "Save hero banners"}
          </button>
        </div>
      </div>
    </form>
  );
}
