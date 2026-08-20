import { connectDB } from "@/lib/db";
import FreeResource from "@/models/FreeResource";
import ContentSeed from "@/models/ContentSeed";

export interface FreeResourceSection {
  heading: string;
  body: string;
  image: string;
}

export interface FreeResourceData {
  _id: string;
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  overview: string;
  highlights: string[];
  terms: string[];
  sections: FreeResourceSection[];
  downloadUrl: string;
  downloadCount: number;
  originalPrice: number;
  featured: boolean;
  status: "draft" | "published";
}

const STARTER_RESOURCES = [
  {
    title: "75 No-Code Business Ideas",
    slug: "75-no-code-business-ideas",
    category: "Business ideas",
    subtitle: "Practical ideas you can validate without hiring a development team.",
    description: "A concise collection of digital business concepts, organised by audience, effort and revenue model.",
    overview: "Use this guide to move from a blank page to a shortlist of ideas worth validating. Each concept is designed to help founders think clearly about the customer, problem and simplest first version.",
    highlights: ["75 clearly grouped ideas", "Validation prompts", "Revenue-model examples", "No-code launch checklist"],
    terms: ["Free digital download", "For personal and internal business use", "No resale or redistribution"],
    sections: [{ heading: "Choose an idea with evidence", body: "Start with a customer problem you understand, then use the included prompts to test demand before investing in a full build.", image: "" }],
    downloadCount: 1840,
    originalPrice: 999,
    featured: true,
  },
  {
    title: "The Startup Marketing Plan",
    slug: "startup-marketing-plan",
    category: "Marketing",
    subtitle: "A focused 30-day plan for launching your first campaigns.",
    description: "Plan positioning, channels, weekly experiments and success metrics in one practical workbook.",
    overview: "A lightweight marketing system for early-stage teams that need priorities, not another long strategy document.",
    highlights: ["30-day campaign planner", "Channel scorecard", "Weekly experiment sheet", "Simple KPI tracker"],
    terms: ["Free digital workbook", "Editable for your business", "No resale"],
    sections: [], downloadCount: 1260, originalPrice: 799, featured: true,
  },
  {
    title: "High-Converting Email Templates",
    slug: "high-converting-email-templates",
    category: "Sales",
    subtitle: "Ready-to-adapt emails for outreach, follow-up and customer wins.",
    description: "A practical swipe file for common sales and customer communication moments.",
    overview: "Replace generic outreach with clear, human templates built around relevance and a single next step.",
    highlights: ["Cold outreach sequences", "Follow-up messages", "Customer onboarding", "Win-back templates"],
    terms: ["Free digital download", "Commercial use inside your business", "No template resale"],
    sections: [], downloadCount: 2215, originalPrice: 1299, featured: true,
  },
  {
    title: "YouTube Growth Playbook",
    slug: "youtube-growth-playbook",
    category: "Content",
    subtitle: "A repeatable workflow for topics, titles and consistent publishing.",
    description: "Turn channel ideas into a sustainable publishing calendar with practical research prompts.",
    overview: "This playbook helps small teams create a focused content loop from research through publication and review.",
    highlights: ["Topic research framework", "Title and hook prompts", "Publishing checklist", "Review dashboard"],
    terms: ["Free PDF guide", "Personal and team use", "No resale"],
    sections: [], downloadCount: 980, originalPrice: 699, featured: false,
  },
  {
    title: "Google Sheets Business Toolkit",
    slug: "google-sheets-business-toolkit",
    category: "Productivity",
    subtitle: "Simple trackers for leads, budgets, projects and weekly reporting.",
    description: "A starter pack of spreadsheet structures for running essential business operations.",
    overview: "Get organised without buying another tool. Copy the templates you need and adapt them to your workflow.",
    highlights: ["Lead tracker", "Budget planner", "Project board", "Weekly metrics sheet"],
    terms: ["Free template pack", "Make unlimited internal copies", "No resale"],
    sections: [], downloadCount: 3045, originalPrice: 1499, featured: true,
  },
  {
    title: "Essential Marketing Starter Guide",
    slug: "essential-marketing-starter-guide",
    category: "Marketing",
    subtitle: "The fundamentals of positioning, offers and customer acquisition.",
    description: "A direct introduction to the decisions that shape a useful marketing strategy.",
    overview: "Build a clear foundation before spending on campaigns: audience, promise, proof and distribution.",
    highlights: ["Positioning canvas", "Offer checklist", "Channel selection", "Measurement basics"],
    terms: ["Free digital guide", "Internal business use", "No redistribution"],
    sections: [], downloadCount: 1140, originalPrice: 599, featured: false,
  },
  {
    title: "How to Sell Your Digital Product",
    slug: "how-to-sell-your-digital-product",
    category: "Sales",
    subtitle: "A step-by-step guide from offer design to the first customer.",
    description: "Define your buyer, package the value and launch with a clean sales process.",
    overview: "A practical launch guide for templates, software, courses and other digital products.",
    highlights: ["Offer design", "Landing-page outline", "Launch sequence", "Customer feedback loop"],
    terms: ["Free digital download", "Personal and business use", "No resale"],
    sections: [], downloadCount: 1735, originalPrice: 899, featured: false,
  },
  {
    title: "Starting From Zero",
    slug: "starting-from-zero",
    category: "Entrepreneurship",
    subtitle: "A founder workbook for turning uncertainty into the next action.",
    description: "Prompts and frameworks to help first-time founders find focus and build momentum.",
    overview: "Work through customer, problem, solution and distribution questions in a sensible order.",
    highlights: ["Founder clarity prompts", "Problem interview guide", "First-offer planner", "90-day roadmap"],
    terms: ["Free workbook", "Personal use", "No resale"],
    sections: [], downloadCount: 865, originalPrice: 499, featured: false,
  },
  {
    title: "SaaS Acquisition Handbook Collection",
    slug: "saas-acquisition-handbook-collection",
    category: "SaaS",
    subtitle: "A compact library covering evaluation, growth and acquisition readiness.",
    description: "Founder-friendly reading for understanding recurring-revenue software businesses.",
    overview: "Learn what makes a software business durable, measurable and easier to evaluate.",
    highlights: ["SaaS metrics glossary", "Growth-quality checklist", "Due-diligence overview", "Risk questions"],
    terms: ["Free ebook collection", "Educational use", "No redistribution"],
    sections: [], downloadCount: 645, originalPrice: 1599, featured: false,
  },
  {
    title: "Productivity Framework Comparison",
    slug: "productivity-framework-comparison",
    category: "Productivity",
    subtitle: "Choose a planning method that matches the way your team works.",
    description: "A plain-language comparison of popular prioritisation and execution frameworks.",
    overview: "Compare systems by team size, meeting rhythm, planning horizon and maintenance effort.",
    highlights: ["Framework comparison", "Decision guide", "Setup checklist", "Team review prompts"],
    terms: ["Free digital guide", "Team use allowed", "No resale"],
    sections: [], downloadCount: 590, originalPrice: 399, featured: false,
  },
  {
    title: "Founder’s Weekend Journal",
    slug: "founders-weekend-journal",
    category: "Entrepreneurship",
    subtitle: "A guided journal for making one important business decision each week.",
    description: "Short weekly prompts for reviewing progress, assumptions and the next priority.",
    overview: "Create a calm operating rhythm with a concise weekly founder review.",
    highlights: ["12 weekly reviews", "Decision log", "Assumption tracker", "Next-action planner"],
    terms: ["Free printable journal", "Personal use", "No resale"],
    sections: [], downloadCount: 735, originalPrice: 499, featured: false,
  },
  {
    title: "SaaS Launch Case Study",
    slug: "saas-launch-case-study",
    category: "Case study",
    subtitle: "A transparent breakdown of planning, build and launch decisions.",
    description: "See how a focused product moved from requirements to a working first release.",
    overview: "A concise case study covering scope, trade-offs, validation and the first operating metrics.",
    highlights: ["Scope decisions", "Launch timeline", "Key trade-offs", "Lessons learned"],
    terms: ["Free case study", "Educational use", "No resale"],
    sections: [], downloadCount: 480, originalPrice: 299, featured: false,
  },
].map((resource) => ({
  ...resource,
  coverImage: "",
  galleryImages: [],
  downloadUrl: "",
  status: "published" as const,
}));

export async function ensureStarterFreeResources() {
  await connectDB();
  const key = "free-resources-v1";
  if (await ContentSeed.exists({ key })) return;
  try {
    await ContentSeed.create({ key });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return;
    throw error;
  }
  if ((await FreeResource.countDocuments({})) === 0) {
    try {
      await FreeResource.insertMany(STARTER_RESOURCES);
    } catch (error) {
      await ContentSeed.deleteOne({ key });
      throw error;
    }
  }
}

export async function getPublishedFreeResources(): Promise<FreeResourceData[]> {
  await ensureStarterFreeResources();
  const rows = await FreeResource.find({ status: "published" })
    .sort({ featured: -1, downloadCount: -1, createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(rows));
}

export async function getFreeResourceBySlug(slug: string): Promise<FreeResourceData | null> {
  await ensureStarterFreeResources();
  const row = await FreeResource.findOne({ slug, status: "published" }).lean();
  return row ? JSON.parse(JSON.stringify(row)) : null;
}
