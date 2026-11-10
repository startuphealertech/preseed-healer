import { Router } from "express";
import { SiteSettingsSchema, type ApiSuccess, type SiteSettings } from "@preseedhealer/types";
import { revalidateWeb } from "../../lib/revalidate";
import { requireAdmin } from "../../middleware/auth";
import { Settings } from "./settings.model";
import { getSiteSettings } from "./settings.service";

export const settingsRouter = Router();

settingsRouter.get("/", async (_req, res) => {
  const data = await getSiteSettings();
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ ok: true, data } satisfies ApiSuccess<SiteSettings>);
});

/** Admin router (mounted behind requireAuth). */
export const adminSettingsRouter = Router();

adminSettingsRouter.get("/", async (_req, res) => {
  res.json({ ok: true, data: await getSiteSettings() });
});

adminSettingsRouter.put("/", requireAdmin, async (req, res) => {
  const input = SiteSettingsSchema.parse(req.body);
  await Settings.findOneAndUpdate({ key: "site" }, { $set: input }, { upsert: true });
  revalidateWeb(["settings"]);
  res.json({ ok: true, data: await getSiteSettings() });
});
