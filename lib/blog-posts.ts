import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";

export interface BlogSectionData { heading: string; body: string; image: string }
export interface BlogPostData {
  _id: string; title: string; slug: string; excerpt: string; category: string;
  coverImage: string; author: string; authorRole: string; intro: string;
  sections: BlogSectionData[]; readTime: number; publishedAt: string;
  featured: boolean; status: "draft" | "published";
}

export const STARTER_BLOG_POSTS: BlogPostData[] = [
  {
    _id: "starter-launch", title: "How to launch business software without starting from zero", slug: "launch-business-software-faster",
    excerpt: "A practical framework for choosing a proven product, defining the right scope and reaching launch day with fewer surprises.",
    category: "Business growth", coverImage: "/images/techbro-hero-ready-made.png", author: "TechBro Editorial", authorRole: "Product and launch team",
    intro: "A successful software launch is rarely about writing the most code. It is about choosing the right starting point, understanding the workflow and making decisions in the right order.",
    sections: [
      { heading: "Start with the business workflow", body: "Before choosing technology, write down how customers discover you, what action they need to complete and what your team must manage afterwards. This becomes the smallest useful version of the product.\n\nA clear workflow prevents attractive but unnecessary features from taking over the launch.", image: "" },
      { heading: "Choose a proven foundation", body: "A ready-made product can remove weeks of repetitive setup. Compare it against your essential workflow, ownership requirements and integration needs—not only its visual design.", image: "/images/techbro-software-showcase.png" },
      { heading: "Plan launch before customisation", body: "Confirm who supplies content, who approves each screen, where the product will be hosted and what happens after launch. A short approval cycle keeps the project moving and makes the delivery date realistic.", image: "" },
    ], readTime: 6, publishedAt: "2026-08-20T00:00:00.000Z", featured: true, status: "published",
  },
  {
    _id: "starter-ownership", title: "What complete source-code ownership means for your company", slug: "complete-source-code-ownership",
    excerpt: "Understand the practical difference between owning your software and renting access to a platform.", category: "Ownership",
    coverImage: "/images/techbro-hero-source-code.png", author: "Kirti Gunjan", authorRole: "Founder, TechBro",
    intro: "Source-code ownership gives your business options. You can change providers, add features and control deployment without rebuilding the product from the beginning.",
    sections: [
      { heading: "Ownership removes platform lock-in", body: "When the repository, documentation and deployment access are transferred to you, your business is not dependent on one vendor to keep operating.", image: "" },
      { heading: "What a proper handover includes", body: "A useful handover includes the current source, environment setup instructions, database structure, deployment notes and a list of third-party services. Credentials should be transferred securely and rotated after delivery.", image: "" },
    ], readTime: 5, publishedAt: "2026-08-16T00:00:00.000Z", featured: false, status: "published",
  },
  {
    _id: "starter-checklist", title: "The pre-launch checklist every digital product needs", slug: "digital-product-pre-launch-checklist",
    excerpt: "The essential checks for payments, mobile screens, emails, analytics and customer support before you go live.", category: "Launch guides",
    coverImage: "/images/techbro-hero-premium.png", author: "TechBro Editorial", authorRole: "Product and launch team",
    intro: "Launch day should confirm work already completed, not reveal problems for the first time. This checklist focuses on the paths that affect real customers.",
    sections: [
      { heading: "Test the complete customer journey", body: "Create a test account and move through discovery, checkout, confirmation and support. Test success and failure states on both desktop and a real phone.", image: "" },
      { heading: "Verify operational alerts", body: "Confirm that customer emails, admin notifications and payment webhooks arrive in the correct inboxes. Record who responds when something fails.", image: "" },
      { heading: "Prepare the first week", body: "Keep the launch scope stable, monitor the highest-value paths and collect feedback in one place. Fix blockers first and schedule cosmetic improvements after the product is stable.", image: "" },
    ], readTime: 7, publishedAt: "2026-08-12T00:00:00.000Z", featured: false, status: "published",
  },
  {
    _id: "starter-budget", title: "How to budget for a website beyond the listed price", slug: "website-budget-beyond-listed-price",
    excerpt: "A clear breakdown of product cost, hosting, integrations, maintenance and optional custom development.", category: "Planning",
    coverImage: "/images/techbro-software-showcase.png", author: "TechBro Editorial", authorRole: "Business solutions team",
    intro: "The product price is only one part of a responsible software budget. Separating one-time work from recurring infrastructure makes proposals easier to compare.",
    sections: [
      { heading: "Separate build costs from operating costs", body: "The build covers the product and agreed customisation. Domains, hosting, email delivery and paid APIs normally renew independently.", image: "" },
      { heading: "Keep a change budget", body: "Reserve a small amount for improvements discovered after real customers begin using the product. Prioritise changes that improve conversion, reliability or team efficiency.", image: "" },
    ], readTime: 4, publishedAt: "2026-08-08T00:00:00.000Z", featured: false, status: "published",
  },
];

let seeded = false;
export async function ensureStarterBlogPosts() {
  if (seeded) return;
  await connectDB();
  if ((await BlogPost.countDocuments({})) === 0) {
    await BlogPost.insertMany(STARTER_BLOG_POSTS.map(({ _id, ...post }) => post));
  }
  seeded = true;
}

export async function getPublishedBlogPosts(): Promise<BlogPostData[]> {
  try {
    await ensureStarterBlogPosts();
    const rows = await BlogPost.find({ status: "published" }).sort({ featured: -1, publishedAt: -1 }).lean();
    return JSON.parse(JSON.stringify(rows)) as BlogPostData[];
  } catch { return STARTER_BLOG_POSTS; }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostData | null> {
  try {
    await ensureStarterBlogPosts();
    const row = await BlogPost.findOne({ slug, status: "published" }).lean();
    return row ? JSON.parse(JSON.stringify(row)) as BlogPostData : null;
  } catch { return STARTER_BLOG_POSTS.find((post) => post.slug === slug) ?? null; }
}
