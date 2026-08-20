import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import { blogPostSchema } from "@/lib/validations/blog-post";
import { slugify } from "@/lib/slugify";
import BlogPost from "@/models/BlogPost";
export async function GET(req: NextRequest) { if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); await connectDB(); return NextResponse.json({ posts: await BlogPost.find({}).sort({ updatedAt: -1 }).lean() }); }
export async function POST(req: NextRequest) { if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); try { await connectDB(); const parsed = blogPostSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check the form" }, { status: 400 }); let slug = parsed.data.slug || slugify(parsed.data.title); if (await BlogPost.exists({ slug })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`; const post = await BlogPost.create({ ...parsed.data, slug }); return NextResponse.json({ post }, { status: 201 }); } catch (error) { console.error("POST /api/admin/blog failed:", error); return NextResponse.json({ error: "Could not create this article" }, { status: 500 }); } }
