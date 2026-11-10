import { Router } from "express";
import { z } from "zod";
import { FaqInputSchema, PageInputSchema, PartnerInputSchema } from "@preseedhealer/types";
import { crudRouter } from "../../lib/crud";
import { toDto } from "../../lib/dto";
import { HttpError } from "../../lib/http-error";
import { Faq, Page, Partner } from "./directory.models";

/* ---------------- Public ---------------- */

export const partnersRouter = Router();

partnersRouter.get("/", async (req, res) => {
  const { placement } = z.object({ placement: z.enum(["investors", "partners"]).optional() }).parse(req.query);
  const filter: Record<string, unknown> = { published: true };
  if (placement === "investors") filter.showOnInvestors = true;
  if (placement === "partners") filter.showOnPartners = true;
  const docs = await Partner.find(filter).sort({ order: 1, name: 1 }).lean();
  res.json({ ok: true, data: docs.map(toDto) });
});

export const faqsRouter = Router();

faqsRouter.get("/", async (_req, res) => {
  const docs = await Faq.find({ published: true }).sort({ group: 1, order: 1, createdAt: 1 }).lean();
  res.json({ ok: true, data: docs.map(toDto) });
});

export const pagesRouter = Router();

pagesRouter.get("/", async (_req, res) => {
  const docs = await Page.find({ published: true }).select("title slug updatedAt").sort({ title: 1 }).lean();
  res.json({
    ok: true,
    data: docs.map((d) => ({ title: d.title, slug: d.slug, updatedAt: new Date(d.updatedAt).toISOString() })),
  });
});

pagesRouter.get("/:slug", async (req, res) => {
  const doc = await Page.findOne({ slug: req.params.slug, published: true }).lean();
  if (!doc) throw HttpError.notFound("Page not found");
  res.json({ ok: true, data: toDto(doc) });
});

/* ---------------- Admin ---------------- */

export const adminPartnersRouter = crudRouter({
  model: Partner,
  schema: PartnerInputSchema,
  label: "Partner",
  sort: { order: 1, name: 1 },
  tags: () => ["partners"],
});

export const adminFaqsRouter = crudRouter({
  model: Faq,
  schema: FaqInputSchema,
  label: "FAQ",
  sort: { group: 1, order: 1 },
  tags: () => ["faqs"],
});

export const adminPagesRouter = crudRouter({
  model: Page,
  schema: PageInputSchema,
  label: "Page",
  sort: { title: 1 },
  uniqueField: "slug",
  tags: (doc) => ["pages", `page:${doc.slug}`],
});
