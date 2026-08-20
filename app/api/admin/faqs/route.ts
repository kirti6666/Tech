import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { faqSchema } from "@/lib/validations/faq";
import Faq from "@/models/Faq";
export async function GET(req: NextRequest) { if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); return NextResponse.json({ faqs: await Faq.find({}).sort({ displayOrder: 1 }).lean() }); }
export async function POST(req: NextRequest) { if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); try { await connectDB(); const parsed = faqSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the FAQ details" }, { status: 400 }); const faq = await Faq.create(parsed.data); return NextResponse.json({ faq }, { status: 201 }); } catch { return NextResponse.json({ error: "Could not add FAQ" }, { status: 500 }); } }
