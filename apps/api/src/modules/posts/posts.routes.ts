import { Router } from "express";
import { z } from "zod";
import { CategoryInputSchema, PaginationQuerySchema, PostInputSchema } from "@preseedhealer/types";
import { escapeRegex, paginate, toDto } from "../../lib/dto";
import { HttpError } from "../../lib/http-error";
import { revalidateWeb } from "../../lib/revalidate";
import { uniqueSlug } from "../../lib/slug";
import { Category } from "./category.model";
import { Post, readingMinutes } from "./post.model";
import {
  categoriesWithCounts,
  getPublishedPost,
  listPublishedPosts,
  postSitemap,
  toPost,
  toSummary,
} from "./posts.service";

/* ---------------- Public ---------------- */

export const postsRouter = Router();

const ListQuery = PaginationQuerySchema.extend({
  category: z.string().trim().max(120).optional(),
  q: z.string().trim().max(80).optional(),
});

postsRouter.get("/", async (req, res) => {
  const query = ListQuery.parse(req.query);
  res.json({ ok: true, data: await listPublishedPosts(query) });
});

postsRouter.get("/sitemap", async (_req, res) => {
  res.json({ ok: true, data: await postSitemap() });
});

postsRouter.get("/:slug", async (req, res) => {
  const data = await getPublishedPost(req.params.slug);
  if (!data) throw HttpError.notFound("Post not found");
  res.json({ ok: true, data });
});

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  res.json({ ok: true, data: await categoriesWithCounts() });
});

/* ---------------- Admin ---------------- */

export const adminPostsRouter = Router();

const AdminListQuery = PaginationQuerySchema.extend({
  status: z.enum(["draft", "published"]).optional(),
  q: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

adminPostsRouter.get("/", async (req, res) => {
  const { page, limit, status, q } = AdminListQuery.parse(req.query);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) filter.title = new RegExp(escapeRegex(q), "i");
  const [docs, total] = await Promise.all([
    Post.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug")
      .lean(),
    Post.countDocuments(filter),
  ]);
  res.json({ ok: true, data: paginate(docs.map(toSummary), total, page, limit) });
});

adminPostsRouter.get("/:id", async (req, res) => {
  const doc = await Post.findById(req.params.id).populate("category", "name slug").lean();
  if (!doc) throw HttpError.notFound("Post not found");
  res.json({ ok: true, data: toPost(doc) });
});

async function preparePost(body: unknown, excludeId?: string) {
  const input = PostInputSchema.parse(body);
  const slug = await uniqueSlug(Post, input.slug || input.title, excludeId);
  if (input.category && !(await Category.exists({ _id: input.category }))) {
    throw HttpError.badRequest("Selected category does not exist");
  }
  // Publishing without a date means "now"; keep an existing date otherwise.
  const publishedAt = input.status === "published" ? (input.publishedAt ?? new Date()) : input.publishedAt;
  return { ...input, slug, publishedAt, readingMinutes: readingMinutes(input.content) };
}

adminPostsRouter.post("/", async (req, res) => {
  const data = await preparePost(req.body);
  const doc = await Post.create(data);
  revalidateWeb(["posts", `post:${doc.slug}`]);
  const saved = await Post.findById(doc._id).populate("category", "name slug").lean();
  res.status(201).json({ ok: true, data: toPost(saved!) });
});

adminPostsRouter.patch("/:id", async (req, res) => {
  const existing = await Post.findById(req.params.id).lean();
  if (!existing) throw HttpError.notFound("Post not found");
  const data = await preparePost(req.body, String(existing._id));
  const doc = await Post.findByIdAndUpdate(existing._id, data, { returnDocument: "after" }).populate("category", "name slug").lean();
  revalidateWeb(["posts", `post:${existing.slug}`, `post:${data.slug}`]);
  res.json({ ok: true, data: toPost(doc!) });
});

adminPostsRouter.delete("/:id", async (req, res) => {
  const doc = await Post.findByIdAndDelete(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Post not found");
  revalidateWeb(["posts", `post:${doc.slug}`]);
  res.json({ ok: true, data: null });
});

export const adminCategoriesRouter = Router();

adminCategoriesRouter.get("/", async (_req, res) => {
  res.json({ ok: true, data: await categoriesWithCounts() });
});

adminCategoriesRouter.get("/:id", async (req, res) => {
  const doc = await Category.findById(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Category not found");
  res.json({ ok: true, data: toDto(doc) });
});

adminCategoriesRouter.post("/", async (req, res) => {
  const input = CategoryInputSchema.parse(req.body);
  const doc = await Category.create({ ...input, slug: await uniqueSlug(Category, input.slug || input.name) });
  revalidateWeb(["posts", "categories"]);
  res.status(201).json({ ok: true, data: toDto(doc.toObject()) });
});

adminCategoriesRouter.patch("/:id", async (req, res) => {
  const input = CategoryInputSchema.parse(req.body);
  const slug = await uniqueSlug(Category, input.slug || input.name, req.params.id);
  const doc = await Category.findByIdAndUpdate(req.params.id, { ...input, slug }, { returnDocument: "after" }).lean();
  if (!doc) throw HttpError.notFound("Category not found");
  revalidateWeb(["posts", "categories"]);
  res.json({ ok: true, data: toDto(doc) });
});

adminCategoriesRouter.delete("/:id", async (req, res) => {
  const inUse = await Post.countDocuments({ category: req.params.id });
  if (inUse > 0) throw new HttpError(409, "IN_USE", `${inUse} post(s) use this category. Move them first.`);
  const doc = await Category.findByIdAndDelete(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Category not found");
  revalidateWeb(["posts", "categories"]);
  res.json({ ok: true, data: null });
});
