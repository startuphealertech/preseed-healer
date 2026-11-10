import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import type { ApiError } from "@preseedhealer/types";
import { isProd } from "../config/env";
import { HttpError } from "../lib/http-error";

export const notFound: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Route ${req.method} ${req.path} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let body: ApiError["error"] = { code: "INTERNAL", message: "Something went wrong" };

  if (err instanceof HttpError) {
    status = err.status;
    body = { code: err.code, message: err.message };
  } else if (err instanceof ZodError) {
    status = 400;
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ??= []).push(issue.message);
    }
    body = { code: "VALIDATION", message: "Invalid input", fields };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    body = { code: "BAD_ID", message: `Invalid ${err.path}` };
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    body = { code: "BAD_JSON", message: "Malformed JSON body" };
  } else if (err?.type === "entity.too.large") {
    status = 413;
    body = { code: "TOO_LARGE", message: "Request body too large" };
  }

  if (status >= 500) {
    console.error(err);
    if (!isProd && err instanceof Error) body.message = err.message;
  }

  const payload: ApiError = { ok: false, error: body };
  res.status(status).json(payload);
};
