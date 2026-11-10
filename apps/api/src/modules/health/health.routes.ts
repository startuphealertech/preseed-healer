import { Router } from "express";
import { isDbReady } from "../../lib/db";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const db = isDbReady();
  res.status(db ? 200 : 503).json({
    ok: db,
    data: { status: db ? "ok" : "degraded", db: db ? "up" : "down", uptime: process.uptime() },
  });
});
