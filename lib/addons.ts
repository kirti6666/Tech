import { connectDB } from "@/lib/db";
import AddonSettings from "@/models/AddonSettings";
import { ADDON_TYPES, DEFAULT_SAC_CODE, type AddonType } from "@/types/catalog";

export interface AddonOffer {
  type: AddonType;
  label: string;
  description: string;
  price: number;
  sacCode: string;
  gstRate: number;
  isActive: boolean;
  displayOrder: number;
}

/**
 * Seed values, used on first read and as the fallback if the settings
 * document is missing. Real prices belong in the admin screen, not here —
 * these exist so checkout can never render an empty add-on list.
 *
 * The copy is written from the buyer's side: what they get, not what the
 * team does internally.
 */
export const DEFAULT_ADDONS: AddonOffer[] = [
  {
    type: "rebranding",
    label: "Rebranding",
    description:
      "We replace the logo, colours, app name and domain throughout the product and hand back your branded build.",
    price: 15000,
    sacCode: DEFAULT_SAC_CODE,
    gstRate: 18,
    isActive: true,
    displayOrder: 0,
  },
  {
    type: "deployment",
    label: "Deployment & setup",
    description:
      "We install the product on your server, point your domain at it, fit the SSL certificate and confirm it runs.",
    price: 10000,
    sacCode: DEFAULT_SAC_CODE,
    gstRate: 18,
    isActive: true,
    displayOrder: 1,
  },
  {
    type: "maintenance",
    label: "Maintenance — 6 months",
    description:
      "Bug fixes, security patches and dependency updates for six months after handover.",
    price: 24000,
    sacCode: DEFAULT_SAC_CODE,
    gstRate: 18,
    isActive: true,
    displayOrder: 2,
  },
];

/**
 * Reads the add-on catalogue, creating the settings document with the
 * defaults on first use.
 *
 * Returns every add-on including inactive ones — the checkout filters to
 * active, but an order placed last month may reference one that has since
 * been switched off, and its label still has to render on the invoice.
 */
export async function getAddons(): Promise<AddonOffer[]> {
  try {
    await connectDB();
    let doc = await AddonSettings.findOne({ singletonKey: "addons" }).lean();
    if (!doc) {
      const created = await AddonSettings.create({
        singletonKey: "addons",
        addons: DEFAULT_ADDONS,
      });
      doc = created.toObject();
    }
    const addons = (doc as { addons?: AddonOffer[] })?.addons ?? [];
    return addons.length ? addons : DEFAULT_ADDONS;
  } catch (error) {
    console.error("getAddons failed, using defaults:", error);
    return DEFAULT_ADDONS;
  }
}

export async function getActiveAddons(): Promise<AddonOffer[]> {
  const addons = await getAddons();
  return addons
    .filter((addon) => addon.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function isAddonType(value: string): value is AddonType {
  return (ADDON_TYPES as readonly string[]).includes(value);
}
