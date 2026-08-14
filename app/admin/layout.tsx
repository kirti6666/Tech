import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/middleware/getServerUser";
import { connectDB } from "@/lib/db";
import ServiceRequest from "@/models/ServiceRequest";
import Enquiry from "@/models/Enquiry";
import Appointment from "@/models/Appointment";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/**
 * Admin shell.
 *
 * The role check lives here rather than only in each page, so a new admin
 * route added later is protected by existing in this folder. The API routes
 * still guard themselves independently — a layout protects the screen, not
 * the data behind it, and anyone can call an endpoint directly.
 *
 * Visually quieter than the storefront: lavender ground, white content
 * cards, purple reserved for the current nav item and primary actions.
 * Someone works in this panel for hours, and an interface that shouts is
 * exhausting by the third hour.
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/");

  // Counts of work waiting on a human, shown as nav badges. This is the
  // whole reason an operator opens the panel — surfacing it in the sidebar
  // saves clicking into two screens to discover there's nothing to do.
  await connectDB();
  const [openServices, newEnquiries, upcomingAppointments] = await Promise.all([
    ServiceRequest.countDocuments({ status: { $in: ["pending", "in_progress"] } }),
    Enquiry.countDocuments({ status: "new" }),
    Appointment.countDocuments({ status: "confirmed", startAt: { $gte: new Date() } }),
  ]);

  return (
    <div className="min-h-screen bg-paper-alt">
      <div className="mx-auto flex max-w-shell gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6">
            <Link href="/" className="logotype block px-2">
              TechBro
            </Link>
            <p className="label-muted mt-1 px-2">Admin</p>

            <AdminNav
              counts={{
                "/admin/services": openServices,
                "/admin/enquiries": newEnquiries,
                "/admin/appointments": upcomingAppointments,
              }}
            />

            <div className="mt-8 rounded-lg bg-paper p-3 shadow-card">
              <p className="truncate text-sm font-medium text-ink">
                {user.email}
              </p>
              <p className="truncate text-xs text-ink-faint">Administrator</p>
              <Link
                href="/"
                className="mt-2 inline-block text-xs font-medium text-accent-deep hover:underline"
              >
                Back to the site
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-16">
          <div className="mb-5 rounded-xl bg-paper p-3 shadow-card lg:hidden">
            <div className="flex items-center justify-between gap-3 px-2">
              <div>
                <Link href="/" className="font-semibold text-ink">TechBro</Link>
                <span className="ml-2 text-xs font-medium uppercase tracking-wider text-accent-deep">Admin</span>
              </div>
              <Link href="/" className="text-xs font-medium text-accent-deep">View site</Link>
            </div>
            <AdminNav
              counts={{
                "/admin/services": openServices,
                "/admin/enquiries": newEnquiries,
                "/admin/appointments": upcomingAppointments,
              }}
              mobile
            />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
