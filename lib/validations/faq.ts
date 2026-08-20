import { z } from "zod";

export const faqSchema = z.object({
  question: z.string().trim().min(5).max(240),
  answer: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(2).max(80),
  categoryDescription: z.string().trim().max(180).default(""),
  linkLabel: z.string().trim().max(80).default(""),
  linkHref: z.string().trim().refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value), "Enter a site path or complete URL").default(""),
  displayOrder: z.coerce.number().int().min(0).max(10000).default(0),
  status: z.enum(["published", "hidden"]).default("published"),
});
