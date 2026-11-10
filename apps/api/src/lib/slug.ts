import type { Model } from "mongoose";
import { slugify } from "@preseedhealer/types";

/** Returns `base` or `base-2`, `base-3`… so the slug is unique within the collection. */
export async function uniqueSlug(
  model: Model<any>,
  source: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(source) || "item";
  let candidate = base;
  for (let i = 2; i < 500; i++) {
    const filter: Record<string, unknown> = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await model.exists(filter);
    if (!exists) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}
