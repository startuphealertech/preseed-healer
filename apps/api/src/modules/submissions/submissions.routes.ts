import { Router, type Request } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  ApplicationInputSchema,
  ApplicationStatusSchema,
  CONTACT_SUBJECT_LABELS,
  ContactInputSchema,
  INVESTOR_TYPE_LABELS,
  InvestorInterestInputSchema,
  LeadStatusSchema,
  PaginationQuerySchema,
  STARTUP_STAGE_LABELS,
  TICKET_SIZE_LABELS,
} from "@preseedhealer/types";
import { toCsv } from "../../lib/csv";
import { escapeRegex, paginate, toDto } from "../../lib/dto";
import { HttpError } from "../../lib/http-error";
import { notifyTeam, sendMail } from "../../lib/mailer";
import { Application, ContactMessage, InvestorInterest, makeRefCode, normalizeEmail } from "./submissions.models";

/* ---------------- Public ---------------- */

export const submissionsRouter = Router();

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, error: { code: "RATE_LIMITED", message: "Too many submissions. Please try again later." } },
});

const isBot = (req: Request) => typeof req.body?.hp === "string" && req.body.hp.trim() !== "";

submissionsRouter.post("/applications", formLimiter, async (req, res) => {
  // Honeypot: pretend success so bots don't learn they were caught.
  if (isBot(req)) return void res.status(201).json({ ok: true, data: { refCode: makeRefCode() } });

  const { consent: _c, hp: _hp, ...input } = ApplicationInputSchema.parse(req.body);

  const duplicate = await Application.exists({
    email: input.email,
    startupName: new RegExp(`^${escapeRegex(input.startupName)}$`, "i"),
    phase: input.phase,
  });
  if (duplicate) {
    throw new HttpError(409, "DUPLICATE", "You've already applied with this startup for this phase. We'll be in touch.");
  }

  const doc = await Application.create({ ...input, refCode: makeRefCode(), consentAt: new Date(), ip: req.ip ?? "" });

  void sendMail({
    to: input.email,
    subject: `We received your application (${doc.refCode})`,
    text: [
      `Hi ${input.founderName},`,
      "",
      `Thanks for applying to PreSeedHealer with ${input.startupName}. Your reference number is ${doc.refCode}.`,
      "Our team reviews every application. Shortlisted founders will be contacted by email.",
      "",
      "Team PreSeedHealer",
    ].join("\n"),
  });
  notifyTeam(
    `New application: ${input.startupName} (${doc.refCode})`,
    `${input.founderName} <${input.email}>, ${input.phone}\n${input.sector} · ${STARTUP_STAGE_LABELS[input.stage]} · Ask ${input.fundingAsk}\n\n${input.oneLiner}\n\nDeck: ${input.pitchDeckUrl}`,
    input.email,
  );

  res.status(201).json({ ok: true, data: { refCode: doc.refCode } });
});

submissionsRouter.post("/investor-interests", formLimiter, async (req, res) => {
  if (isBot(req)) return void res.status(201).json({ ok: true, data: null });
  const { consent: _c, hp: _hp, ...input } = InvestorInterestInputSchema.parse(req.body);
  const emailKey = normalizeEmail(input.email);

  // The unique index on emailKey also catches two identical submissions racing past this check.
  const duplicateInvestor = () =>
    new HttpError(409, "DUPLICATE", "You've already registered your interest with this email. Our team will be in touch.");
  if (await InvestorInterest.exists({ $or: [{ email: emailKey }, { emailKey }] })) throw duplicateInvestor();
  try {
    await InvestorInterest.create({ ...input, email: emailKey, emailKey, consentAt: new Date(), ip: req.ip ?? "" });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw duplicateInvestor();
    throw err;
  }

  notifyTeam(
    `New investor interest: ${input.name}`,
    `${input.name} <${input.email}>, ${input.phone}\n${INVESTOR_TYPE_LABELS[input.investorType]} · ${input.organization || "—"} · Ticket ${TICKET_SIZE_LABELS[input.ticketSize]}\nSectors: ${input.sectors.join(", ")}\n\n${input.message}`,
    input.email,
  );
  res.status(201).json({ ok: true, data: null });
});

submissionsRouter.post("/contact", formLimiter, async (req, res) => {
  if (isBot(req)) return void res.status(201).json({ ok: true, data: null });
  const { hp: _hp, ...input } = ContactInputSchema.parse(req.body);
  await ContactMessage.create({ ...input, ip: req.ip ?? "" });

  notifyTeam(
    `Contact form: ${CONTACT_SUBJECT_LABELS[input.subject]} from ${input.name}`,
    `${input.name} <${input.email}> ${input.phone}\n\n${input.message}`,
    input.email,
  );
  res.status(201).json({ ok: true, data: null });
});

/* ---------------- Admin ---------------- */

const ListQuery = PaginationQuerySchema.extend({
  status: z.string().trim().max(30).optional(),
  q: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

function searchFilter(q: string | undefined, fields: string[]) {
  if (!q) return {};
  const rx = new RegExp(escapeRegex(q), "i");
  return { $or: fields.map((f) => ({ [f]: rx })) };
}

const fmtDate = (d: Date) => new Date(d).toISOString().replace("T", " ").slice(0, 16);

/* Applications */
export const adminApplicationsRouter = Router();

adminApplicationsRouter.get("/", async (req, res) => {
  const { page, limit, status, q } = ListQuery.parse(req.query);
  const filter = {
    ...(status ? { status: ApplicationStatusSchema.parse(status) } : {}),
    ...searchFilter(q, ["startupName", "founderName", "email", "refCode", "city"]),
  };
  const [docs, total] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);
  res.json({ ok: true, data: paginate(docs.map(toDto), total, page, limit) });
});

adminApplicationsRouter.get("/export.csv", async (_req, res) => {
  const docs = await Application.find().sort({ createdAt: -1 }).lean();
  const csv = toCsv(docs, [
    { header: "Ref", value: (d) => d.refCode },
    { header: "Submitted", value: (d) => fmtDate(d.createdAt) },
    { header: "Status", value: (d) => d.status },
    { header: "Startup", value: (d) => d.startupName },
    { header: "Founder", value: (d) => d.founderName },
    { header: "Email", value: (d) => d.email },
    { header: "Phone", value: (d) => d.phone },
    { header: "City", value: (d) => d.city },
    { header: "Sector", value: (d) => d.sector },
    { header: "Stage", value: (d) => d.stage },
    { header: "Founded", value: (d) => d.foundedYear },
    { header: "Team", value: (d) => d.teamSize },
    { header: "DPIIT", value: (d) => (d.dpiitRecognised ? "Yes" : "No") },
    { header: "One-liner", value: (d) => d.oneLiner },
    { header: "Raised so far", value: (d) => d.raisedSoFar },
    { header: "Ask", value: (d) => d.fundingAsk },
    { header: "Monthly revenue", value: (d) => d.monthlyRevenue },
    { header: "Deck", value: (d) => d.pitchDeckUrl },
    { header: "Website", value: (d) => d.website },
    { header: "LinkedIn", value: (d) => d.linkedin },
    { header: "Phase", value: (d) => d.phase },
    { header: "Notes", value: (d) => d.notes },
  ]);
  sendCsv(res, "applications", csv);
});

adminApplicationsRouter.get("/:id", async (req, res) => {
  const doc = await Application.findById(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Application not found");
  res.json({ ok: true, data: toDto(doc) });
});

adminApplicationsRouter.patch("/:id", async (req, res) => {
  const input = z
    .object({ status: ApplicationStatusSchema.optional(), notes: z.string().max(5000).optional() })
    .parse(req.body);
  const doc = await Application.findByIdAndUpdate(req.params.id, input, { returnDocument: "after" }).lean();
  if (!doc) throw HttpError.notFound("Application not found");
  res.json({ ok: true, data: toDto(doc) });
});

adminApplicationsRouter.delete("/:id", async (req, res) => {
  const doc = await Application.findByIdAndDelete(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Application not found");
  res.json({ ok: true, data: null });
});

/* Investor interests */
export const adminInvestorInterestsRouter = Router();

adminInvestorInterestsRouter.get("/", async (req, res) => {
  const { page, limit, status, q } = ListQuery.parse(req.query);
  const filter = {
    ...(status ? { status: LeadStatusSchema.parse(status) } : {}),
    ...searchFilter(q, ["name", "email", "organization"]),
  };
  const [docs, total] = await Promise.all([
    InvestorInterest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    InvestorInterest.countDocuments(filter),
  ]);
  res.json({ ok: true, data: paginate(docs.map(toDto), total, page, limit) });
});

adminInvestorInterestsRouter.get("/export.csv", async (_req, res) => {
  const docs = await InvestorInterest.find().sort({ createdAt: -1 }).lean();
  const csv = toCsv(docs, [
    { header: "Submitted", value: (d) => fmtDate(d.createdAt) },
    { header: "Status", value: (d) => d.status },
    { header: "Name", value: (d) => d.name },
    { header: "Email", value: (d) => d.email },
    { header: "Phone", value: (d) => d.phone },
    { header: "Organisation", value: (d) => d.organization },
    { header: "Type", value: (d) => d.investorType },
    { header: "Ticket", value: (d) => TICKET_SIZE_LABELS[d.ticketSize as keyof typeof TICKET_SIZE_LABELS] ?? d.ticketSize },
    { header: "Sectors", value: (d) => d.sectors },
    { header: "LinkedIn", value: (d) => d.linkedin },
    { header: "Message", value: (d) => d.message },
    { header: "Notes", value: (d) => d.notes },
  ]);
  sendCsv(res, "investors", csv);
});

adminInvestorInterestsRouter.get("/:id", async (req, res) => {
  const doc = await InvestorInterest.findById(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Lead not found");
  res.json({ ok: true, data: toDto(doc) });
});

adminInvestorInterestsRouter.patch("/:id", async (req, res) => {
  const input = z.object({ status: LeadStatusSchema.optional(), notes: z.string().max(5000).optional() }).parse(req.body);
  const doc = await InvestorInterest.findByIdAndUpdate(req.params.id, input, { returnDocument: "after" }).lean();
  if (!doc) throw HttpError.notFound("Lead not found");
  res.json({ ok: true, data: toDto(doc) });
});

adminInvestorInterestsRouter.delete("/:id", async (req, res) => {
  const doc = await InvestorInterest.findByIdAndDelete(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Lead not found");
  res.json({ ok: true, data: null });
});

/* Contact messages */
export const adminMessagesRouter = Router();

adminMessagesRouter.get("/", async (req, res) => {
  const { page, limit, status, q } = ListQuery.parse(req.query);
  const filter = {
    ...(status === "unread" ? { read: false } : status === "read" ? { read: true } : {}),
    ...searchFilter(q, ["name", "email", "message"]),
  };
  const [docs, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
  ]);
  res.json({ ok: true, data: paginate(docs.map(toDto), total, page, limit) });
});

adminMessagesRouter.get("/:id", async (req, res) => {
  const doc = await ContactMessage.findById(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Message not found");
  res.json({ ok: true, data: toDto(doc) });
});

adminMessagesRouter.patch("/:id", async (req, res) => {
  const input = z.object({ read: z.boolean() }).parse(req.body);
  const doc = await ContactMessage.findByIdAndUpdate(req.params.id, input, { returnDocument: "after" }).lean();
  if (!doc) throw HttpError.notFound("Message not found");
  res.json({ ok: true, data: toDto(doc) });
});

adminMessagesRouter.delete("/:id", async (req, res) => {
  const doc = await ContactMessage.findByIdAndDelete(req.params.id).lean();
  if (!doc) throw HttpError.notFound("Message not found");
  res.json({ ok: true, data: null });
});

function sendCsv(res: import("express").Response, name: string, csv: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="preseedhealer-${name}-${stamp}.csv"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(csv);
}
