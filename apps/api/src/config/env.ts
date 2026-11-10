import path from "node:path";
import { z } from "zod";

const list = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  /** Browser origins allowed to call the API directly. The web app normally proxies, so this is a fallback. */
  CORS_ORIGINS: list("http://localhost:3100"),
  /** Number of reverse-proxy hops in front of the API (e.g. Next.js rewrite + platform LB = 2). */
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  WEB_URL: z.url().default("http://localhost:3100"),
  REVALIDATE_SECRET: z.string().min(16, "REVALIDATE_SECRET must be at least 16 chars"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  SESSION_DAYS: z.coerce.number().int().min(1).max(90).default(7),

  UPLOAD_DIR: z.string().default(path.resolve(process.cwd(), "uploads")),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(20).default(5),

  // Email (optional). Without SMTP_HOST, emails are logged to the console instead of sent.
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  MAIL_FROM: z.string().default("PreSeedHealer <no-reply@preseedhealer.com>"),
  /** Comma-separated team inboxes that receive new-submission alerts. */
  NOTIFY_EMAILS: list(""),

  // Used only by `npm run seed` to create the first admin.
  SEED_ADMIN_EMAIL: z.string().default(""),
  SEED_ADMIN_PASSWORD: z.string().default(""),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
