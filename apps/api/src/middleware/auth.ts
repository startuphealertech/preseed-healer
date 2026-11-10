import type { CookieOptions, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import type { AdminUser } from "@preseedhealer/types";
import { env, isProd } from "../config/env";
import { HttpError } from "../lib/http-error";

export const SESSION_COOKIE = "psh_session";

type SessionPayload = { sub: string; role: AdminUser["role"] };

declare module "express-serve-static-core" {
  interface Request {
    session?: SessionPayload;
  }
}

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
  maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000,
});

export function setSession(res: Response, user: { id: string; role: AdminUser["role"] }) {
  const token = jwt.sign({ sub: user.id, role: user.role } satisfies SessionPayload, env.JWT_SECRET, {
    expiresIn: `${env.SESSION_DAYS}d`,
    algorithm: "HS256",
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions());
}

export function clearSession(res: Response) {
  const { maxAge: _m, ...opts } = cookieOptions();
  res.clearCookie(SESSION_COOKIE, opts);
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) return next(HttpError.unauthorized("Please sign in"));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as SessionPayload;
    req.session = { sub: payload.sub, role: payload.role };
    next();
  } catch {
    next(HttpError.unauthorized("Session expired, please sign in again"));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.session?.role !== "admin") return next(HttpError.forbidden("Admins only"));
  next();
};
