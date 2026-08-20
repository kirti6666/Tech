import { connectDB } from "@/lib/db";
import Faq from "@/models/Faq";
import { ensureStarterFaqs, type FaqData } from "@/lib/faqs";
import { FaqManager } from "@/components/admin/FaqManager";
export default async function AdminFaqsPage() { await ensureStarterFaqs(); await connectDB(); const items = JSON.parse(JSON.stringify(await Faq.find({}).sort({ displayOrder: 1, createdAt: 1 }).lean())) as FaqData[]; return <div><header className="mb-6"><p className="label">Support content</p><h1 className="mt-1 font-display text-4xl font-light tracking-tight text-ink">FAQs</h1><p className="mt-2 text-sm text-ink-faint">Manage public questions, categories, ordering and visibility.</p></header><FaqManager initial={items} /></div>; }
