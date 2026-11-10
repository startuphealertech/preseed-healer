import { z } from "zod";

/**
 * Site-wide settings editable from the admin panel (Phase 5).
 * Drives the announcement bar, phase badges, contact info and social links
 * so these can change without a redeploy.
 */

export const PhaseStatusSchema = z.enum(["open", "closed", "coming-soon"]);
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

const PhaseSchema = z.object({
  status: PhaseStatusSchema,
  /** Short human label, e.g. "Open until further notice". */
  label: z.string().trim().max(80),
});

const optionalUrl = z.union([z.url(), z.literal("")]).default("");

export const SiteSettingsSchema = z.object({
  announcement: z.object({
    enabled: z.boolean(),
    text: z.string().trim().max(140),
    href: z.string().trim().max(300).default(""),
  }),
  phases: z.object({
    phase01: PhaseSchema,
    phase02: PhaseSchema,
  }),
  contact: z.object({
    email: z.union([z.email(), z.literal("")]).default(""),
    phone: z.string().trim().max(20).default(""),
    address: z.string().trim().max(300).default(""),
  }),
  social: z.object({
    linkedin: optionalUrl,
    instagram: optionalUrl,
    x: optionalUrl,
    youtube: optionalUrl,
    whatsapp: optionalUrl,
  }),
});

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

/** Used to seed the DB and as the web app's fallback when the API is unreachable. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  announcement: {
    enabled: true,
    text: "Phase 01 applications open · Open until further notice",
    href: "/phase-01",
  },
  phases: {
    phase01: { status: "open", label: "Open until further notice" },
    phase02: { status: "coming-soon", label: "Coming soon" },
  },
  contact: { email: "", phone: "", address: "" },
  social: { linkedin: "", instagram: "", x: "", youtube: "", whatsapp: "" },
};
