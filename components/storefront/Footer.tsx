import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Storefront footer — entirely driven by Site Settings (about text, link
 * columns, contact details, social links, copyright). Add/remove/reorder any
 * of it from /admin/settings → Footer / Contact & Social.
 */
export async function Footer() {
  const settings = await getSiteSettings();
  const { brand, footer, contact, social } = settings;

  const socials = [
    { url: social.facebook, Icon: Facebook, label: "Facebook" },
    { url: social.instagram, Icon: Instagram, label: "Instagram" },
    { url: social.twitter, Icon: Twitter, label: "Twitter" },
    { url: social.youtube, Icon: Youtube, label: "YouTube" },
  ].filter((s) => s.url.trim());

  const copyright = (footer.copyrightText || "").replace("{year}", String(new Date().getFullYear()));

  return (
    <footer className="border-t mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-4">
        {/* Brand / about */}
        <div className="space-y-3">
          <p className="font-bold text-lg">{brand.storeName}</p>
          {footer.about && <p className="text-sm text-gray-500 max-w-xs">{footer.about}</p>}
          {socials.length > 0 && (
            <div className="flex gap-3 pt-1">
              {socials.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Link columns */}
        {footer.columns.map((col, i) => (
          <div key={i}>
            {col.title && <p className="font-medium mb-3">{col.title}</p>}
            <ul className="space-y-2 text-sm text-gray-500">
              {col.links.map((lnk, j) => (
                <li key={j}>
                  <Link href={lnk.href || "#"} className="hover:text-gray-800 hover:underline">
                    {lnk.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact */}
        {(contact.email || contact.phone || contact.address) && (
          <div>
            <p className="font-medium mb-3">Contact</p>
            <ul className="space-y-2 text-sm text-gray-500">
              {contact.email && (
                <li className="flex items-center gap-2">
                  <Mail size={14} /> {contact.email}
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-2">
                  <Phone size={14} /> {contact.phone}
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5" /> {contact.address}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {copyright && (
        <div className="border-t">
          <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-gray-400 text-center">{copyright}</div>
        </div>
      )}
    </footer>
  );
}
