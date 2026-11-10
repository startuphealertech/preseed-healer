import { Router } from "express";
import type { DashboardStats } from "@preseedhealer/types";
import { Partner } from "../directory/directory.models";
import { Post } from "../posts/post.model";
import { Application, ContactMessage, InvestorInterest } from "../submissions/submissions.models";

export const adminDashboardRouter = Router();

adminDashboardRouter.get("/", async (_req, res) => {
  const [
    appsTotal,
    appsNew,
    appsShortlisted,
    invTotal,
    invNew,
    msgTotal,
    msgUnread,
    published,
    drafts,
    partners,
    recent,
  ] = await Promise.all([
    Application.countDocuments(),
    Application.countDocuments({ status: "new" }),
    Application.countDocuments({ status: "shortlisted" }),
    InvestorInterest.countDocuments(),
    InvestorInterest.countDocuments({ status: "new" }),
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ read: false }),
    Post.countDocuments({ status: "published" }),
    Post.countDocuments({ status: "draft" }),
    Partner.countDocuments({ published: true }),
    Application.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("refCode startupName founderName sector status createdAt")
      .lean(),
  ]);

  const data: DashboardStats = {
    applications: { total: appsTotal, new: appsNew, shortlisted: appsShortlisted },
    investors: { total: invTotal, new: invNew },
    messages: { total: msgTotal, unread: msgUnread },
    posts: { published, drafts },
    partners,
    recentApplications: recent.map((a) => ({
      id: String(a._id),
      refCode: a.refCode,
      startupName: a.startupName,
      founderName: a.founderName,
      sector: a.sector as DashboardStats["recentApplications"][number]["sector"],
      status: a.status as DashboardStats["recentApplications"][number]["status"],
      createdAt: new Date(a.createdAt).toISOString(),
    })),
  };
  res.json({ ok: true, data });
});
