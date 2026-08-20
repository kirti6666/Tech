import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { faqSchema } from "@/lib/validations/faq";
import Faq from "@/models/Faq";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) { if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); const parsed = faqSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the FAQ details" }, { status: 400 }); const faq = await Faq.findByIdAndUpdate(params.id, parsed.data, { new: true, runValidators: true }); return faq ? NextResponse.json({ faq }) : NextResponse.json({ error: "FAQ not found" }, { status: 404 }); }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); const faq = await Faq.findByIdAndDelete(params.id); return faq ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "FAQ not found" }, { status: 404 }); }
