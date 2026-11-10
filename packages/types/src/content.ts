import { z } from "zod";
import { ImageRefSchema, ObjectIdSchema, OptionalUrlSchema, SeoSchema, SlugSchema } from "./common";

/* ---------- Categories ---------- */

export const CategoryInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.union([SlugSchema, z.literal("")]).default(""),
  description: z.string().trim().max(300).default(""),
});
export type CategoryInput = z.input<typeof CategoryInputSchema>;
export type Category = { id: string; name: string; slug: string; description: string; postCount?: number };
export type CategoryRef = { id: string; name: string; slug: string };

/* ---------- Posts ---------- */

export const PostStatusSchema = z.enum(["draft", "published"]);
export type PostStatus = z.infer<typeof PostStatusSchema>;

export const FaqItemSchema = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(1).max(3000),
});
export type FaqItem = z.infer<typeof FaqItemSchema>;

export const PostInputSchema = z.object({
  title: z.string().trim().min(5, "Title is too short").max(160),
  slug: z.union([SlugSchema, z.literal("")]).default(""),
  excerpt: z.string().trim().max(320).default(""),
  /** Markdown (GFM). */
  content: z.string().max(200_000).default(""),
  coverImage: ImageRefSchema,
  coverAlt: z.string().trim().max(200).default(""),
  category: z.union([ObjectIdSchema, z.literal(""), z.null()]).default(null).transform((v) => v || null),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  author: z.string().trim().max(80).default(""),
  status: PostStatusSchema.default("draft"),
  publishedAt: z.union([z.coerce.date(), z.literal(""), z.null()]).optional().transform((v) => (v ? v : null)),
  seo: SeoSchema.prefault({}),
  faqs: z.array(FaqItemSchema).max(40).default([]),
});
export type PostInput = z.input<typeof PostInputSchema>;

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  coverAlt: string;
  category: CategoryRef | null;
  status: PostStatus;
  publishedAt: string | null;
  readingMinutes: number;
  updatedAt: string;
};

export type Post = PostSummary & {
  content: string;
  tags: string[];
  author: string;
  seo: z.output<typeof SeoSchema>;
  faqs: FaqItem[];
  createdAt: string;
};

export type PostWithRelated = { post: Post; related: PostSummary[] };

/* ---------- Partners / investors directory ---------- */

export const PARTNER_TYPES = [
  "angel",
  "vc",
  "family-office",
  "corporate",
  "incubator",
  "institutional",
  "mentor",
  "channel",
] as const;
export const PartnerTypeSchema = z.enum(PARTNER_TYPES);
export type PartnerType = z.infer<typeof PartnerTypeSchema>;

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  angel: "Angel Investors",
  vc: "Venture Capital",
  "family-office": "Family Offices",
  corporate: "Corporate Investors",
  incubator: "Incubators & Accelerators",
  institutional: "Institutional & Ecosystem",
  mentor: "Mentors & Experts",
  channel: "Channel Partners",
};

export const PartnerInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  organization: z.string().trim().max(120).default(""),
  /** Short role label shown on the card, e.g. "Angel Investor Partner". */
  role: z.string().trim().max(120).default(""),
  type: PartnerTypeSchema,
  description: z.string().trim().max(600).default(""),
  image: ImageRefSchema,
  website: OptionalUrlSchema,
  showOnInvestors: z.boolean().default(true),
  showOnPartners: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
});
export type PartnerInput = z.input<typeof PartnerInputSchema>;
export type Partner = z.output<typeof PartnerInputSchema> & { id: string };

/* ---------- FAQs ---------- */

export const FaqInputSchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(2).max(3000),
  group: z.string().trim().min(2).max(60).default("General"),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
});
export type FaqInput = z.input<typeof FaqInputSchema>;
export type Faq = z.output<typeof FaqInputSchema> & { id: string };

/* ---------- CMS pages (legal etc.) ---------- */

export const PageInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: SlugSchema,
  /** Markdown (GFM). */
  content: z.string().max(200_000).default(""),
  seo: SeoSchema.prefault({}),
  published: z.boolean().default(true),
});
export type PageInput = z.input<typeof PageInputSchema>;
export type Page = z.output<typeof PageInputSchema> & { id: string; updatedAt: string };
export type PageRef = { title: string; slug: string; updatedAt: string };
