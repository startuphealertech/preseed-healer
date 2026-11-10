import { z } from "zod";

export const ObjectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

/** Accepts a full URL or an empty string (for optional URL inputs in forms). */
export const OptionalUrlSchema = z.union([z.url({ error: "Enter a valid URL (https://…)" }), z.literal("")]).default("");

/** Image reference: absolute https URL or a site-relative path (e.g. /api/v1/uploads/x.webp). */
export const ImageRefSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Enter a URL or upload an image")
  .default("");

export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 ()-]{7,18}$/, "Enter a valid phone number");

export const SeoSchema = z.object({
  title: z.string().trim().max(70, "Keep SEO titles under 70 characters").default(""),
  description: z.string().trim().max(170, "Keep meta descriptions under 170 characters").default(""),
  ogImage: ImageRefSchema,
});
export type Seo = z.output<typeof SeoSchema>;

/** Hidden honeypot field on public forms; bots fill it, humans don't. */
export const HoneypotSchema = z.string().optional();

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
}

export const SECTORS = [
  "Fintech",
  "Healthtech",
  "Edtech",
  "Agritech",
  "D2C / Consumer",
  "SaaS / B2B",
  "Deeptech / AI",
  "Climate / Cleantech",
  "Mobility / EV",
  "Logistics",
  "Media / Content",
  "Other",
] as const;
export const SectorSchema = z.enum(SECTORS, { error: "Choose a sector" });
export type Sector = z.infer<typeof SectorSchema>;
