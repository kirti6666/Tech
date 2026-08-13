import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Thin promo bar pinned above the header. Renders nothing unless the admin has
 * enabled it (and given it text) in Site Settings → Announcement.
 */
export async function AnnouncementBar() {
  const settings = await getSiteSettings();
  const { enabled, text, link } = settings.announcement;

  if (!enabled || !text.trim()) return null;

  const content = <span>{text}</span>;

  return (
    <div className="bg-primary text-primary-foreground text-center text-sm py-2 px-4">
      {link ? (
        <Link href={link} className="hover:underline">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
