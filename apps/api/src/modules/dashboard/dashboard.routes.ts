import { Router } from "express";
import type { DashboardStats } from "@preseedhealer/types";
import { Partner } from "../directory/directory.models";
import { Post } from "../posts/post.model";
import { Application, ContactMessage, InvestorInterest } from "../submissions/submissions.models";

export const adminDashboardRouter = Router();

type Recent = NonNullable<DashboardStats["recentApplications"]>[number];

/** Submission counts and recent applicants are personal data: only computed and returned for admins. */
async function submissionStats(): Promise<Pick<DashboardStats, "applications" | "investors" | "messages" | "recentApplications">> {
  const [appsTotal, appsNew, appsShortlisted, invTotal, invNew, msgTotal, msgUnread, recent] = await Promise.all([
    Application.countDocuments(),
    Application.countDocuments({ status: "new" }),
    Application.countDocuments({ status: "shortlisted" }),
    InvestorInterest.countDocuments(),
    InvestorInterest.countDocuments({ status: "new" }),
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ read: false }),
    Application.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("refCode startupName founderName sector status createdAt")
      .lean(),
  ]);
  return {
    applications: { total: appsTotal, new: appsNew, shortlisted: appsShortlisted },
    investors: { total: invTotal, new: invNew },
    messages: { total: msgTotal, unread: msgUnread },
    recentApplications: recent.map((a) => ({
      id: String(a._id),
      refCode: a.refCode,
      startupName: a.startupName,
      founderName: a.founderName,
      sector: a.sector as Recent["sector"],
      status: a.status as Recent["status"],
      createdAt: new Date(a.createdAt).toISOString(),
    })),
  };
}

adminDashboardRouter.get("/", async (req, res) => {
  const isAdmin = req.session?.role === "admin";
  const [published, drafts, partners, submissions] = await Promise.all([
    Post.countDocuments({ status: "published" }),
    Post.countDocuments({ status: "draft" }),
    Partner.countDocuments({ published: true }),
    isAdmin ? submissionStats() : Promise.resolve({}),
  ]);

  const data: DashboardStats = { posts: { published, drafts }, partners, ...submissions };
  res.json({ ok: true, data });
});
