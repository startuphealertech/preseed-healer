import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProd } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Behind reverse proxies (Next.js rewrite, platform LB): trust N hops so req.ip is the real client.
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(isProd ? "combined" : "dev", { skip: (req) => req.url.startsWith("/api/v1/uploads") }));

  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      // Static images and server-side page builds shouldn't eat into the budget.
      skip: (req) => req.path.startsWith("/v1/uploads") || (req.method === "GET" && !req.path.startsWith("/v1/admin")),
    }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
