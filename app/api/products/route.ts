import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  parseCatalogueParams,
  queryCatalogue,
  PAGE_SIZE,
} from "@/lib/catalogue";

export const dynamic = "force-dynamic";

/**
 * GET /api/products — the same catalogue query the pages use.
 *
 * The storefront does not call this: /shop and the landing pages render on
 * the server and read straight from the query builder. This exists for the
 * mobile app, for whatever internal tooling comes later, and to keep one
 * place where "what does a public product look like" is defined.
 *
 * It shares parseCatalogueParams with the pages deliberately. Two parsers
 * would mean an API filter and a page filter that agree today and disagree
 * after the next change.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const params = parseCatalogueParams(raw);
    const result = await queryCatalogue(params);

    return NextResponse.json({
      products: result.products,
      pagination: {
        page: result.page,
        pageSize: PAGE_SIZE,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json(
      { error: "Could not load products" },
      { status: 500 }
    );
  }
}

/**
 * Product writes live in the admin API (/api/admin/products), behind
 * requireAdmin. Keeping them out of this file means the public route has no
 * mutating handler to accidentally leave unguarded.
 */
