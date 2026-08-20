import { z } from "zod";

const imageValue = z.string().trim().refine(
  (value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value),
  "Use an uploaded image or a complete image URL"
);

export const blogPostSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190).optional(),
  excerpt: z.string().trim().min(10).max(600),
  category: z.string().trim().min(2).max(80),
  coverImage: imageValue.default(""),
  author: z.string().trim().min(2).max(100),
  authorRole: z.string().trim().max(140).default(""),
  intro: z.string().trim().min(10).max(5000),
  sections: z.array(z.object({
    heading: z.string().trim().min(2).max(180),
    body: z.string().trim().min(10).max(12000),
    image: imageValue.default(""),
  })).min(1).max(20),
  readTime: z.coerce.number().int().min(1).max(120).default(5),
  publishedAt: z.coerce.date(),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
