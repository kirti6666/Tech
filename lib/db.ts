import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development, and across serverless function invocations in production.
 * Without this, each API route call could open a new DB connection.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Prefer Atlas' IPv4 endpoints on networks that expose synthesized
      // NAT64 addresses. Those can fail during TLS negotiation and hide the
      // useful Atlas "IP not allowed" diagnostic behind a generic SSL error.
      family: 4,
      /**
       * Fail fast when the database is unreachable. Mongoose defaults to 30
       * seconds of server selection, which means a page that catches its own
       * database errors and falls back — getSiteSettings does exactly that —
       * still blocks for half a minute before reaching the fallback.
       *
       * In production that turns a brief database blip into requests that
       * hang until the platform's own timeout kills them. At build time it
       * exceeds Next.js's 60-second static worker limit and fails the whole
       * build. Five seconds is far longer than a healthy connection needs
       * and short enough that a fallback is actually a fallback.
       */
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
