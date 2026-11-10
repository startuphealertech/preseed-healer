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

/** Email, trimmed and lower-cased *before* validation, so a pasted " Name@Example.com " is accepted and normalised. */
export const EmailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));

export const PHONE_MIN_DIGITS = 8;
export const PHONE_MAX_DIGITS = 15;
/**
 * Phone number with optional leading + and common separators (spaces, dashes, dots, brackets),
 * e.g. "+91 98765 43210", "(555) 123-4567", "+44 20 7946 0958". Must contain 8–15 actual digits
 * (E.164 allows at most 15), so separator-only input like "1-------" is rejected.
 */
export const PhoneSchema = z
  .string()
  .trim()
  .max(25, "Enter a valid phone number")
  .regex(/^\+?[0-9 ().-]+$/, "Enter a valid phone number")
  .refine((v) => {
    const digits = v.replace(/\D/g, "").length;
    return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
  }, "Enter a valid phone number");

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
