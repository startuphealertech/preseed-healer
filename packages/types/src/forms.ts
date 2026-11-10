import { z } from "zod";
import { HoneypotSchema, OptionalUrlSchema, PhoneSchema, SectorSchema } from "./common";

const consent = z.literal(true, { error: "Please accept to continue" });

/* ---------- Startup application ---------- */

export const STARTUP_STAGES = ["idea", "mvp", "early-revenue", "growth", "scale"] as const;
export const StartupStageSchema = z.enum(STARTUP_STAGES, { error: "Choose your stage" });
export const STARTUP_STAGE_LABELS: Record<(typeof STARTUP_STAGES)[number], string> = {
  idea: "Idea / Concept",
  mvp: "MVP / Prototype",
  "early-revenue": "Early revenue",
  growth: "Growth",
  scale: "Scaling",
};

export const ApplicationInputSchema = z.object({
  // Founder
  founderName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  phone: PhoneSchema,
  linkedin: OptionalUrlSchema,
  city: z.string().trim().min(2, "Enter your city").max(60),
  // Startup
  startupName: z.string().trim().min(2, "Enter your startup's name").max(100),
  website: OptionalUrlSchema,
  sector: SectorSchema,
  stage: StartupStageSchema,
  foundedYear: z.coerce.number().int().min(1990, "Enter a valid year").max(new Date().getFullYear() + 1),
  teamSize: z.coerce.number().int().min(1, "At least 1").max(100_000),
  dpiitRecognised: z.boolean().default(false),
  oneLiner: z.string().trim().min(10, "Describe your startup in one line (10+ chars)").max(200),
  description: z.string().trim().min(50, "Tell us a bit more (50+ characters)").max(2000),
  // Fundraising
  raisedSoFar: z.string().trim().max(60).default(""),
  fundingAsk: z.string().trim().min(1, "How much are you raising?").max(60),
  monthlyRevenue: z.string().trim().max(60).default(""),
  pitchDeckUrl: z.url("Share a link to your pitch deck (Google Drive, DocSend, etc.)"),
  heardFrom: z.string().trim().max(100).default(""),
  phase: z.enum(["phase-01", "phase-02"]).default("phase-01"),
  consent,
  hp: HoneypotSchema,
});
export type ApplicationInput = z.input<typeof ApplicationInputSchema>;

export const APPLICATION_STATUSES = ["new", "reviewing", "shortlisted", "rejected"] as const;
export const ApplicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export type Application = Omit<z.output<typeof ApplicationInputSchema>, "consent" | "hp"> & {
  id: string;
  refCode: string;
  status: ApplicationStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

/* ---------- Investor interest ---------- */

export const INVESTOR_TYPES = ["angel", "vc", "family-office", "corporate", "accelerator", "other"] as const;
export const INVESTOR_TYPE_LABELS: Record<(typeof INVESTOR_TYPES)[number], string> = {
  angel: "Angel investor",
  vc: "Venture capital fund",
  "family-office": "Family office",
  corporate: "Corporate / CVC",
  accelerator: "Incubator / Accelerator",
  other: "Other",
};
export const TICKET_SIZES = ["under-10l", "10l-50l", "50l-1cr", "1cr-5cr", "5cr-plus"] as const;
export const TICKET_SIZE_LABELS: Record<(typeof TICKET_SIZES)[number], string> = {
  "under-10l": "Under ₹10L",
  "10l-50l": "₹10L – ₹50L",
  "50l-1cr": "₹50L – ₹1Cr",
  "1cr-5cr": "₹1Cr – ₹5Cr",
  "5cr-plus": "₹5Cr+",
};

export const InvestorInterestInputSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  phone: PhoneSchema,
  organization: z.string().trim().max(120).default(""),
  investorType: z.enum(INVESTOR_TYPES, { error: "Choose investor type" }),
  ticketSize: z.enum(TICKET_SIZES, { error: "Choose a cheque size" }),
  sectors: z.array(SectorSchema).min(1, "Pick at least one sector"),
  linkedin: OptionalUrlSchema,
  message: z.string().trim().max(1000).default(""),
  consent,
  hp: HoneypotSchema,
});
export type InvestorInterestInput = z.input<typeof InvestorInterestInputSchema>;

export const LEAD_STATUSES = ["new", "contacted", "onboarded", "declined"] as const;
export const LeadStatusSchema = z.enum(LEAD_STATUSES);
export type InvestorInterest = Omit<z.output<typeof InvestorInterestInputSchema>, "consent" | "hp"> & {
  id: string;
  status: (typeof LEAD_STATUSES)[number];
  notes: string;
  createdAt: string;
};

/* ---------- Contact ---------- */

export const CONTACT_SUBJECTS = ["general", "startup", "investor", "partnership", "media"] as const;
export const CONTACT_SUBJECT_LABELS: Record<(typeof CONTACT_SUBJECTS)[number], string> = {
  general: "General enquiry",
  startup: "Startup / application",
  investor: "Investor participation",
  partnership: "Partnership",
  media: "Media",
};

export const ContactInputSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  phone: z.union([PhoneSchema, z.literal("")]).default(""),
  subject: z.enum(CONTACT_SUBJECTS).default("general"),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  hp: HoneypotSchema,
});
export type ContactInput = z.input<typeof ContactInputSchema>;
export type ContactMessage = Omit<z.output<typeof ContactInputSchema>, "hp"> & {
  id: string;
  read: boolean;
  createdAt: string;
};

/* ---------- Admin auth ---------- */

export const LoginInputSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password").max(200),
});
export type LoginInput = z.input<typeof LoginInputSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10, "Use at least 10 characters").max(200),
});

export type AdminUser = { id: string; email: string; name: string; role: "admin" | "editor" };

export type DashboardStats = {
  applications: { total: number; new: number; shortlisted: number };
  investors: { total: number; new: number };
  messages: { total: number; unread: number };
  posts: { published: number; drafts: number };
  partners: number;
  recentApplications: Pick<Application, "id" | "refCode" | "startupName" | "founderName" | "sector" | "status" | "createdAt">[];
};
