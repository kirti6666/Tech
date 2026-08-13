import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/middleware/requireAdmin";
import {
  createUploadUrl,
  sourceFileKey,
  statObject,
  deleteObject,
  isStorageConfigured,
} from "@/lib/storage";

/**
 * POST /api/admin/products/[id]/source — signs a direct upload
 * PUT  /api/admin/products/[id]/source — confirms it and records the key
 *
 * Two steps because the file cannot pass through the server: Vercel caps a
 * serverless request body at 4.5 MB and these archives are hundreds of
 * megabytes. The browser PUTs straight to the bucket with a signed URL, then
 * calls back so we can verify the object actually landed before pointing the
 * product at it.
 *
 * The verify step is the point. Without it, a failed upload leaves a product
 * whose sourceFileKey names an object that doesn't exist — and you find out
 * when a paying customer presses Download.
 */

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Object storage is not configured — set the STORAGE_* variables." },
      { status: 503 }
    );
  }

  try {
    await connectDB();

    const body = await req.json();
    const filename = String(body.filename ?? "").trim();
    const contentType = String(body.contentType ?? "application/zip");

    if (!filename) {
      return NextResponse.json({ error: "A filename is required" }, { status: 400 });
    }

    const product = await Product.findById(params.id).select("slug");
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const key = sourceFileKey(product.slug, filename);
    const uploadUrl = await createUploadUrl(key, contentType);

    return NextResponse.json({ uploadUrl, key, filename });
  } catch (error) {
    console.error("POST source upload sign failed:", error);
    return NextResponse.json({ error: "Could not sign the upload" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const body = await req.json();
    const key = String(body.key ?? "").trim();
    const filename = String(body.filename ?? "").trim();

    if (!key) {
      return NextResponse.json({ error: "Missing storage key" }, { status: 400 });
    }
    // The key was minted by POST above for this product's slug. Refusing
    // anything outside that prefix stops a crafted request pointing a
    // product at some other object in the bucket.
    const product = await Product.findById(params.id).select("slug sourceFileKey");
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (!key.startsWith(`source/${product.slug}/`)) {
      return NextResponse.json({ error: "That key doesn't belong to this product" }, { status: 400 });
    }

    const stat = await statObject(key);
    if (!stat) {
      return NextResponse.json(
        { error: "The upload didn't complete — nothing is stored at that key." },
        { status: 400 }
      );
    }

    const previousKey = product.sourceFileKey;

    product.sourceFileKey = key;
    product.sourceFileName = filename || key.split("/").pop();
    product.sourceFileSize = stat.size;
    await product.save();

    // Clean up the replaced archive only after the new one is recorded, so
    // a failure here leaves an orphan object rather than a product with no
    // downloadable file.
    if (previousKey && previousKey !== key) {
      try {
        await deleteObject(previousKey);
      } catch (error) {
        console.error("[source upload] could not delete previous object:", error);
      }
    }

    return NextResponse.json({
      ok: true,
      sourceFileKey: key,
      sourceFileName: product.sourceFileName,
      sourceFileSize: stat.size,
    });
  } catch (error) {
    console.error("PUT source upload confirm failed:", error);
    return NextResponse.json({ error: "Could not save the upload" }, { status: 500 });
  }
}
