import type { Types } from "mongoose";

type WithMongoId = { _id: Types.ObjectId | string; __v?: number };

/** Lean Mongo doc → API shape: `_id` becomes `id`, `__v` dropped, dates become ISO strings in JSON. */
export function toDto<T extends WithMongoId>(doc: T): Omit<T, "_id" | "__v"> & { id: string } {
  const { _id, __v: _v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function toDtos<T extends WithMongoId>(docs: T[]) {
  return docs.map(toDto);
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function paginate<T>(items: T[], total: number, page: number, limit: number) {
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}
