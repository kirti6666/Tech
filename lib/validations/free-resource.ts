import { z } from "zod";

const optionalUrl = z.string().trim().refine((value) => !value || /^https?:\/\//i.test(value), "Enter a complete http(s) URL");

export const freeResourceSchema = z.object({
  title: z.string().trim().min(2).max(140),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160).optional(),
  subtitle: z.string().trim().max(240).default(""),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default(""),
  coverImage: optionalUrl.default(""),
  galleryImages: z.array(optionalUrl).max(12).default([]),
  overview: z.string().trim().max(6000).default(""),
  highlights: z.array(z.string().trim().min(1).max(180)).max(20).default([]),
  terms: z.array(z.string().trim().min(1).max(220)).max(20).default([]),
  sections: z.array(z.object({ heading: z.string().trim().min(1).max(160), body: z.string().trim().max(5000), image: optionalUrl.default("") })).max(12).default([]),
  downloadUrl: optionalUrl.default(""),
  downloadCount: z.coerce.number().int().min(0).max(100000000).default(0),
  originalPrice: z.coerce.number().min(0).max(100000000).default(0),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type FreeResourceInput = z.infer<typeof freeResourceSchema>;
