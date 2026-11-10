import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express, { Router } from "express";
import multer from "multer";
import { env } from "../../config/env";
import { HttpError } from "../../lib/http-error";

// SVG is deliberately excluded: it can carry scripts.
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM
      const dir = path.join(env.UPLOAD_DIR, month);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, `${randomBytes(12).toString("hex")}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(HttpError.badRequest("Only JPG, PNG, WebP, AVIF or GIF images are allowed"));
  },
});

/** Admin: POST /admin/media (multipart field "file") → { url } */
export const adminMediaRouter = Router();

adminMediaRouter.post("/", (req, res, next) => {
  upload.single("file")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? `Image must be under ${env.MAX_UPLOAD_MB} MB` : err.message;
      return next(HttpError.badRequest(msg));
    }
    if (err) return next(err);
    if (!req.file) return next(HttpError.badRequest("No file uploaded"));

    const rel = path.relative(env.UPLOAD_DIR, req.file.path).split(path.sep).join("/");
    res.status(201).json({ ok: true, data: { url: `/api/v1/uploads/${rel}` } });
  });
});

/** Public static serving of uploaded images. */
export const uploadsStatic = express.static(env.UPLOAD_DIR, {
  immutable: true,
  maxAge: "365d",
  index: false,
  dotfiles: "deny",
  setHeaders: (res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  },
});
