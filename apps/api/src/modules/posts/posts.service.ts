import type { PipelineStage } from "mongoose";
import type { CategoryRef, Post as PostDto, PostSummary } from "@preseedhealer/types";
import { escapeRegex, paginate } from "../../lib/dto";
import { Category } from "./category.model";
import { Post } from "./post.model";

const SUMMARY_FIELDS = "title slug excerpt coverImage coverAlt category status publishedAt readingMinutes updatedAt";

type LeanPost = Record<string, any>;

function toCategoryRef(c: any): CategoryRef | null {
  return c && typeof c === "object" && c._id ? { id: String(c._id), name: c.name, slug: c.slug } : null;
}

export function toSummary(p: LeanPost): PostSummary {
  return {
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? "",
    coverImage: p.coverImage ?? "",
    coverAlt: p.coverAlt ?? "",
    category: toCategoryRef(p.category),
    status: p.status,
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    readingMinutes: p.readingMinutes ?? 1,
    updatedAt: new Date(p.updatedAt).toISOString(),
  };
}

export function toPost(p: LeanPost): PostDto {
  return {
    ...toSummary(p),
    content: p.content ?? "",
    tags: p.tags ?? [],
    author: p.author ?? "",
    seo: { title: p.seo?.title ?? "", description: p.seo?.description ?? "", ogImage: p.seo?.ogImage ?? "" },
    faqs: (p.faqs ?? []).map((f: any) => ({ question: f.question, answer: f.answer })),
    createdAt: new Date(p.createdAt).toISOString(),
  };
}

/** Published and not scheduled for the future. */
const liveFilter = (): Record<string, any> => ({ status: "published", publishedAt: { $ne: null, $lte: new Date() } });

export async function listPublishedPosts(opts: { page: number; limit: number; category?: string; q?: string }) {
  const filter: Record<string, unknown> = liveFilter();

  if (opts.category) {
    const cat = await Category.findOne({ slug: opts.category }).lean();
    if (!cat) return { ...paginate<PostSummary>([], 0, opts.page, opts.limit), category: null };
    filter.category = cat._id;
  }
  if (opts.q) {
    const rx = new RegExp(escapeRegex(opts.q.slice(0, 80)), "i");
    filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }];
  }

  const [docs, total] = await Promise.all([
    Post.find(filter)
      .sort({ publishedAt: -1, _id: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .select(SUMMARY_FIELDS)
      .populate("category", "name slug")
      .lean(),
    Post.countDocuments(filter),
  ]);

  const category = opts.category ? await Category.findOne({ slug: opts.category }).lean() : null;
  return {
    ...paginate(docs.map(toSummary), total, opts.page, opts.limit),
    category: category ? { id: String(category._id), name: category.name, slug: category.slug, description: category.description } : null,
  };
}

export async function getPublishedPost(slug: string) {
  const doc = await Post.findOne({ ...liveFilter(), slug }).populate("category", "name slug").lean();
  if (!doc) return null;

  // Related: same category first, then most recent, excluding this post.
  const related = await Post.find({
    ...liveFilter(),
    _id: { $ne: doc._id },
    ...(doc.category ? { category: (doc.category as any)._id } : {}),
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select(SUMMARY_FIELDS)
    .populate("category", "name slug")
    .lean();

  if (related.length < 3) {
    const more = await Post.find({ ...liveFilter(), _id: { $nin: [doc._id, ...related.map((r) => r._id)] } })
      .sort({ publishedAt: -1 })
      .limit(3 - related.length)
      .select(SUMMARY_FIELDS)
      .populate("category", "name slug")
      .lean();
    related.push(...more);
  }

  return { post: toPost(doc), related: related.map(toSummary) };
}

export async function postSitemap() {
  const docs = await Post.find(liveFilter()).select("slug updatedAt").sort({ publishedAt: -1 }).lean();
  return docs.map((d) => ({ slug: d.slug, updatedAt: new Date(d.updatedAt).toISOString() }));
}

export async function categoriesWithCounts() {
  const pipeline: PipelineStage[] = [
    { $match: liveFilter() },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ];
  const [cats, counts] = await Promise.all([Category.find().sort({ name: 1 }).lean(), Post.aggregate(pipeline)]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count as number]));
  return cats.map((c) => ({
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description,
    postCount: byId.get(String(c._id)) ?? 0,
  }));
}
