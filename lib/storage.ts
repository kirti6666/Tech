import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Private object storage for source files.
 *
 * Cloudinary stays where it is for product screenshots — those are meant to
 * be public and served from a CDN. Source archives are the thing customers
 * pay for, so they live in a bucket with no public read path at all, and the
 * only way out is a short-lived signed URL minted per download.
 *
 * The same code works for AWS S3 and Cloudflare R2: R2 speaks the S3 API,
 * needs `region: "auto"` and a custom endpoint. R2 is usually the better
 * choice here because it has no egress fees, and you are shipping
 * multi-hundred-megabyte archives.
 *
 * Configuration is validated on first use rather than at import, so a
 * missing key breaks the download route with a clear message instead of
 * crashing the whole app at boot.
 */

const BUCKET = process.env.STORAGE_BUCKET ?? "";
const ENDPOINT = process.env.STORAGE_ENDPOINT;
const REGION = process.env.STORAGE_REGION ?? "auto";

/** How long a download link stays valid. Short by design — see the note in the route. */
export const DOWNLOAD_URL_TTL_SECONDS = 15 * 60;
/** Upload links are admin-only and cover large files, so they get longer. */
export const UPLOAD_URL_TTL_SECONDS = 60 * 60;

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!BUCKET) {
    throw new Error(
      "STORAGE_BUCKET is not set. Source-file delivery cannot work without private object storage."
    );
  }
  if (!process.env.STORAGE_ACCESS_KEY_ID || !process.env.STORAGE_SECRET_ACCESS_KEY) {
    throw new Error("STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY are not set.");
  }

  if (!client) {
    client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      // R2 requires path-style addressing; S3 accepts it.
      forcePathStyle: Boolean(ENDPOINT),
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

/**
 * A time-limited URL that downloads the object.
 *
 * `filename` sets the Content-Disposition so the browser saves
 * "clinic-management-system.zip" rather than the opaque storage key. The
 * key itself never reaches the customer.
 */
export async function createDownloadUrl(
  key: string,
  filename?: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: filename
      ? `attachment; filename="${filename.replace(/"/g, "")}"`
      : undefined,
  });

  return getSignedUrl(getClient(), command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}

/**
 * A signed URL the admin browser can PUT straight to.
 *
 * Source archives are far too large to pass through a serverless function —
 * Vercel caps a request body at 4.5 MB. The browser uploads directly to the
 * bucket and only the resulting key comes back to the server.
 */
export async function createUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getClient(), command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

/** Confirms an upload landed, and returns its size for the product record. */
export async function statObject(
  key: string
): Promise<{ size: number; contentType?: string } | null> {
  try {
    const result = await getClient().send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );
    return { size: result.ContentLength ?? 0, contentType: result.ContentType };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Storage key for a product's source archive.
 *
 * Includes a random segment so the key can't be guessed from the product
 * slug. That is defence in depth, not the actual protection — the bucket is
 * private and an unguessable key in a public bucket would still be a public
 * file.
 */
export function sourceFileKey(productSlug: string, originalName: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
  return `source/${productSlug}/${random}/${safeName}`;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    BUCKET &&
      process.env.STORAGE_ACCESS_KEY_ID &&
      process.env.STORAGE_SECRET_ACCESS_KEY
  );
}
