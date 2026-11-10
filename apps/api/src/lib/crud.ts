import { Router } from "express";
import type { Model } from "mongoose";
import type { ZodType } from "zod";
import { toDto } from "./dto";
import { HttpError } from "./http-error";
import { revalidateWeb } from "./revalidate";

type CrudOptions = {
  model: Model<any>;
  schema: ZodType<Record<string, unknown>>;
  label: string;
  sort: Record<string, 1 | -1>;
  /** Cache tags to refresh on the web app after a write. */
  tags: (doc: Record<string, any>) => string[];
  /** Field that must be unique (e.g. slug); gives a friendly 409 instead of a Mongo error. */
  uniqueField?: string;
};

/** Standard admin CRUD: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id. */
export function crudRouter({ model, schema, label, sort, tags, uniqueField }: CrudOptions) {
  const r = Router();

  async function assertUnique(data: Record<string, unknown>, excludeId?: string) {
    if (!uniqueField) return;
    const filter: Record<string, unknown> = { [uniqueField]: data[uniqueField] };
    if (excludeId) filter._id = { $ne: excludeId };
    if (await model.exists(filter)) {
      throw new HttpError(409, "DUPLICATE", `Another ${label.toLowerCase()} already uses this ${uniqueField}`);
    }
  }

  r.get("/", async (_req, res) => {
    const docs = await model.find().sort(sort).lean();
    res.json({ ok: true, data: docs.map((d: any) => toDto(d)) });
  });

  r.get("/:id", async (req, res) => {
    const doc = await model.findById(req.params.id).lean();
    if (!doc) throw HttpError.notFound(`${label} not found`);
    res.json({ ok: true, data: toDto(doc as any) });
  });

  r.post("/", async (req, res) => {
    const data = schema.parse(req.body);
    await assertUnique(data);
    const doc = await model.create(data);
    const obj = doc.toObject();
    revalidateWeb(tags(obj));
    res.status(201).json({ ok: true, data: toDto(obj) });
  });

  r.patch("/:id", async (req, res) => {
    const data = schema.parse(req.body);
    await assertUnique(data, req.params.id);
    const before = await model.findById(req.params.id).lean();
    if (!before) throw HttpError.notFound(`${label} not found`);
    const doc = await model.findByIdAndUpdate(req.params.id, data, { returnDocument: "after", runValidators: true }).lean();
    revalidateWeb([...tags(before as any), ...tags(doc as any)]);
    res.json({ ok: true, data: toDto(doc as any) });
  });

  r.delete("/:id", async (req, res) => {
    const doc = await model.findByIdAndDelete(req.params.id).lean();
    if (!doc) throw HttpError.notFound(`${label} not found`);
    revalidateWeb(tags(doc as any));
    res.json({ ok: true, data: null });
  });

  return r;
}
