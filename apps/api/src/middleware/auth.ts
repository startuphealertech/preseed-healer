import { randomUUID } from "node:crypto";
import type { CookieOptions, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import type { AdminUser } from "@preseedhealer/types";
import { env, isProd } from "../config/env";
import { HttpError } from "../lib/http-error";
import { RevokedSession, User } from "../modules/auth/user.model";

export const SESSION_COOKIE = "psh_session";

/** JWT claims: user id, role at sign-in, session id and the user's token version at sign-in. */
type TokenPayload = { sub: string; role: AdminUser["role"]; jti: string; tv: number; exp: number };
type SessionPayload = { sub: string; role: AdminUser["role"]; jti: string; exp: number };

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

export function setSession(res: Response, user: { id: string; role: AdminUser["role"]; tokenVersion: number }) {
  const token = jwt.sign({ sub: user.id, role: user.role, tv: user.tokenVersion }, env.JWT_SECRET, {
    expiresIn: `${env.SESSION_DAYS}d`,
    algorithm: "HS256",
    jwtid: randomUUID(),
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions());
}

export function clearSession(res: Response) {
  const { maxAge: _m, ...opts } = cookieOptions();
  res.clearCookie(SESSION_COOKIE, opts);
}

/** Signature + expiry check only. Returns null for missing, forged, expired or pre-revocation-format tokens. */
export function decodeSessionToken(token: string | undefined): TokenPayload | null {
  if (!token) return null;
  try {
    const p = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as Partial<TokenPayload>;
    if (typeof p.sub !== "string" || typeof p.jti !== "string" || typeof p.tv !== "number" || typeof p.exp !== "number") return null;
    if (p.role !== "admin" && p.role !== "editor") return null;
    return p as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Full session check, run on every protected request: valid signature, not logged out, and the
 * account still exists, is active, has the same role and token version it had at sign-in.
 */
async function resolveSession(req: Request): Promise<SessionPayload | string> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) return "Please sign in";
  const payload = decodeSessionToken(token);
  if (!payload) return "Session expired, please sign in again";

  const [user, revoked] = await Promise.all([
    User.findById(payload.sub).select("role active tokenVersion").lean(),
    RevokedSession.exists({ jti: payload.jti }),
  ]);
  if (revoked) return "You have signed out. Please sign in again";
  if (!user || user.active === false) return "Account no longer exists or is disabled";
  if ((user.tokenVersion ?? 0) !== payload.tv || user.role !== payload.role) {
    return "Your account changed, please sign in again";
  }
  return { sub: payload.sub, role: user.role as AdminUser["role"], jti: payload.jti, exp: payload.exp };
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const result = await resolveSession(req);
    if (typeof result === "string") {
      // Drop the dead cookie so the web app's pre-check sends the browser to the login page.
      if (req.cookies?.[SESSION_COOKIE]) clearSession(res);
      return next(HttpError.unauthorized(result));
    }
    req.session = result;
    next();
  } catch (err) {
    next(err);
  }
};

/** Records the session id as revoked so the token can't be replayed after logout. */
export async function revokeSession(token: string | undefined): Promise<void> {
  const payload = decodeSessionToken(token);
  if (!payload) return;
  await RevokedSession.updateOne(
    { jti: payload.jti },
    { $setOnInsert: { jti: payload.jti, expiresAt: new Date(payload.exp * 1000) } },
    { upsert: true },
  );
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.session?.role !== "admin") return next(HttpError.forbidden("Admins only"));
  next();
};
