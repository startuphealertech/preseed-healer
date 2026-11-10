import "./setup-env";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDb } from "../lib/db";
import { RevokedSession, User } from "../modules/auth/user.model";
import { InvestorInterest } from "../modules/submissions/submissions.models";

export type TestServer = { base: string; close: () => Promise<void> };

export async function startServer(): Promise<TestServer> {
  if (!/_test_|test/i.test(mongoose.connection.name || process.env.MONGODB_URI!)) throw new Error("Refusing to run against a non-test database");
  await connectDb();
  await Promise.all([User.init(), RevokedSession.init(), InvestorInterest.init()]);
  const server: Server = createApp().listen(0);
  await new Promise<void>((r) => server.once("listening", () => r()));
  const { port } = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${port}/api/v1`,
    close: async () => {
      await new Promise<void>((r) => server.close(() => r()));
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    },
  };
}

let ipCounter = 1;
/** A fresh fake client IP, so each test gets its own rate-limit budget. */
export const freshIp = () => `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`;

export type Res = { status: number; body: any; setCookie: string | null };

export async function call(
  base: string,
  path: string,
  { method = "GET", body, cookie, ip = "10.255.0.1" }: { method?: string; body?: unknown; cookie?: string; ip?: string } = {},
): Promise<Res> {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      "x-forwarded-for": ip,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null), setCookie: res.headers.get("set-cookie") };
}

/** Extracts "psh_session=…" from a Set-Cookie header. */
export const sessionCookie = (setCookie: string | null) => {
  const m = setCookie?.match(/psh_session=([^;]*)/);
  if (!m || !m[1]) throw new Error("no session cookie in response");
  return `psh_session=${m[1]}`;
};

export async function createUser(role: "admin" | "editor", password = "correct-horse-battery") {
  const email = `${role}-${Math.random().toString(36).slice(2)}@example.test`;
  const user = await User.create({ email, name: `Test ${role}`, role, passwordHash: await bcrypt.hash(password, 4) });
  return { user, email, password };
}

export async function login(base: string, email: string, password: string) {
  const res = await call(base, "/auth/login", { method: "POST", body: { email, password }, ip: freshIp() });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return sessionCookie(res.setCookie);
}
