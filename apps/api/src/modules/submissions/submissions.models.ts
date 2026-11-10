import { randomBytes } from "node:crypto";
import { Schema, model } from "mongoose";
import {
  APPLICATION_STATUSES,
  CONTACT_SUBJECTS,
  INVESTOR_TYPES,
  LEAD_STATUSES,
  SECTORS,
  STARTUP_STAGES,
  TICKET_SIZES,
} from "@preseedhealer/types";

/** Human-friendly reference shown to applicants, e.g. PSH-26-7K3QXM. */
export function makeRefCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const bytes = randomBytes(6);
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `PSH-${String(new Date().getFullYear()).slice(-2)}-${code}`;
}

const applicationSchema = new Schema(
  {
    refCode: { type: String, required: true, unique: true },
    founderName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    linkedin: { type: String, default: "" },
    city: { type: String, required: true },
    startupName: { type: String, required: true },
    website: { type: String, default: "" },
    sector: { type: String, enum: SECTORS, required: true },
    stage: { type: String, enum: STARTUP_STAGES, required: true },
    foundedYear: { type: Number, required: true },
    teamSize: { type: Number, required: true },
    dpiitRecognised: { type: Boolean, default: false },
    oneLiner: { type: String, required: true },
    description: { type: String, required: true },
    raisedSoFar: { type: String, default: "" },
    fundingAsk: { type: String, required: true },
    monthlyRevenue: { type: String, default: "" },
    pitchDeckUrl: { type: String, required: true },
    heardFrom: { type: String, default: "" },
    phase: { type: String, enum: ["phase-01", "phase-02"], default: "phase-01" },
    status: { type: String, enum: APPLICATION_STATUSES, default: "new" },
    notes: { type: String, default: "" },
    consentAt: { type: Date, required: true },
    ip: { type: String, default: "", select: false },
  },
  { timestamps: true },
);
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ email: 1, startupName: 1, phase: 1 });
export const Application = model("Application", applicationSchema);

const investorInterestSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    organization: { type: String, default: "" },
    investorType: { type: String, enum: INVESTOR_TYPES, required: true },
    ticketSize: { type: String, enum: TICKET_SIZES, required: true },
    sectors: { type: [String], enum: SECTORS, default: [] },
    linkedin: { type: String, default: "" },
    message: { type: String, default: "" },
    status: { type: String, enum: LEAD_STATUSES, default: "new" },
    notes: { type: String, default: "" },
    consentAt: { type: Date, required: true },
    ip: { type: String, default: "", select: false },
  },
  { timestamps: true },
);
investorInterestSchema.index({ status: 1, createdAt: -1 });
export const InvestorInterest = model("InvestorInterest", investorInterestSchema);

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, default: "" },
    subject: { type: String, enum: CONTACT_SUBJECTS, default: "general" },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    ip: { type: String, default: "", select: false },
  },
  { timestamps: true },
);
contactMessageSchema.index({ read: 1, createdAt: -1 });
export const ContactMessage = model("ContactMessage", contactMessageSchema);
