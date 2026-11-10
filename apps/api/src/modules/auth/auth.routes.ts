import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ChangePasswordSchema, LoginInputSchema, type AdminUser } from "@preseedhealer/types";
import { HttpError } from "../../lib/http-error";
import { clearSession, requireAuth, revokeSession, SESSION_COOKIE, setSession } from "../../middleware/auth";
import { User } from "./user.model";

export const authRouter = Router();

// Compared against when the email doesn't exist, so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser-not-a-real-password", 12);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Try again in 15 minutes." } },
});

function toAdminUser(u: { _id: unknown; email: string; name: string; role: string }): AdminUser {
  return { id: String(u._id), email: u.email, name: u.name, role: u.role as AdminUser["role"] };
}

authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = LoginInputSchema.parse(req.body);
  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  // Disabled accounts get the same answer as a wrong password.
  if (!user || !ok || user.active === false) throw new HttpError(401, "INVALID_CREDENTIALS", "Incorrect email or password");

  user.lastLoginAt = new Date();
  await user.save();
  const data = toAdminUser(user);
  setSession(res, { ...data, tokenVersion: user.tokenVersion ?? 0 });
  res.json({ ok: true, data });
});

/** Ends this session server-side (the token is rejected from now on) and clears the cookie. */
authRouter.post("/logout", async (req, res) => {
  await revokeSession(req.cookies?.[SESSION_COOKIE] as string | undefined);
  clearSession(res);
  res.json({ ok: true, data: null });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.session!.sub).lean();
  if (!user) throw HttpError.unauthorized("Account no longer exists");
  res.json({ ok: true, data: toAdminUser(user) });
});

authRouter.post("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
  const user = await User.findById(req.session!.sub).select("+passwordHash");
  if (!user) throw HttpError.unauthorized();
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(400, "WRONG_PASSWORD", "Current password is incorrect");
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  // Sign out every other session; this browser gets a fresh token.
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  setSession(res, { id: String(user._id), role: user.role as AdminUser["role"], tokenVersion: user.tokenVersion });
  res.json({ ok: true, data: null });
});
