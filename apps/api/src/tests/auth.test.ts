import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { call, createUser, freshIp, login, sessionCookie, startServer, type TestServer } from "./helpers";
import { User } from "../modules/auth/user.model";

const SECRET = process.env.JWT_SECRET!;
let srv: TestServer;
before(async () => (srv = await startServer()));
after(async () => srv.close());

const adminGet = (cookie?: string) => call(srv.base, "/admin/posts", { cookie });

describe("BUG-01: session revocation", () => {
  test("valid admin session works", async () => {
    const { email, password } = await createUser("admin");
    const cookie = await login(srv.base, email, password);
    assert.equal((await adminGet(cookie)).status, 200);
    assert.equal((await call(srv.base, "/admin/applications", { cookie })).status, 200);
  });

  test("no cookie, forged and garbage tokens are rejected", async () => {
    assert.equal((await adminGet()).status, 401);
    assert.equal((await adminGet("psh_session=anything")).status, 401);
    const { user } = await createUser("admin");
    const forged = jwt.sign({ sub: String(user._id), role: "admin", tv: 0 }, "wrong-secret-wrong-secret-wrong-secret", { jwtid: "x" });
    assert.equal((await adminGet(`psh_session=${forged}`)).status, 401);
  });

  test("expired token is rejected", async () => {
    const { user } = await createUser("admin");
    const expired = jwt.sign({ sub: String(user._id), role: "admin", tv: 0, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET, { jwtid: "e1" });
    assert.equal((await adminGet(`psh_session=${expired}`)).status, 401);
  });

  test("old-format token (no session id / version) is rejected", async () => {
    const { user } = await createUser("admin");
    const legacy = jwt.sign({ sub: String(user._id), role: "admin" }, SECRET, { expiresIn: "7d" });
    assert.equal((await adminGet(`psh_session=${legacy}`)).status, 401);
  });

  test("logout invalidates the token server-side, other sessions stay valid", async () => {
    const { email, password } = await createUser("admin");
    const a = await login(srv.base, email, password);
    const b = await login(srv.base, email, password);
    const out = await call(srv.base, "/auth/logout", { method: "POST", cookie: a });
    assert.equal(out.status, 200);
    assert.match(out.setCookie ?? "", /psh_session=;/);
    const replay = await adminGet(a);
    assert.equal(replay.status, 401);
    assert.match(replay.setCookie ?? "", /psh_session=;/, "dead cookie is cleared");
    assert.equal((await call(srv.base, "/auth/me", { cookie: a })).status, 401);
    assert.equal((await adminGet(b)).status, 200, "a different device's session is unaffected");
  });

  test("logout without/with invalid cookie still succeeds", async () => {
    assert.equal((await call(srv.base, "/auth/logout", { method: "POST" })).status, 200);
    assert.equal((await call(srv.base, "/auth/logout", { method: "POST", cookie: "psh_session=junk" })).status, 200);
  });

  test("deleted account: read and write both fail", async () => {
    const { user, email, password } = await createUser("admin");
    const cookie = await login(srv.base, email, password);
    await User.deleteOne({ _id: user._id });
    assert.equal((await adminGet(cookie)).status, 401);
    const faq = await call(srv.base, "/admin/faqs", { method: "POST", cookie, body: { question: "Q?", answer: "A", group: "General", order: 0 } });
    assert.equal(faq.status, 401);
  });

  test("disabled account: session fails and login is refused", async () => {
    const { user, email, password } = await createUser("admin");
    const cookie = await login(srv.base, email, password);
    await User.updateOne({ _id: user._id }, { $set: { active: false } });
    assert.equal((await adminGet(cookie)).status, 401);
    const again = await call(srv.base, "/auth/login", { method: "POST", body: { email, password }, ip: freshIp() });
    assert.equal(again.status, 401);
    assert.equal(again.body.error.code, "INVALID_CREDENTIALS");
  });

  test("demoted admin: old session can't reach admin-only APIs (via mongoose update)", async () => {
    const { user, email, password } = await createUser("admin");
    const cookie = await login(srv.base, email, password);
    await User.findOneAndUpdate({ _id: user._id }, { role: "editor" });
    assert.equal((await call(srv.base, "/admin/applications", { cookie })).status, 401);
    assert.equal((await adminGet(cookie)).status, 401);
    // Signing in again gives an editor session: content yes, personal data no.
    const fresh = await login(srv.base, email, password);
    assert.equal((await adminGet(fresh)).status, 200);
    assert.equal((await call(srv.base, "/admin/applications", { cookie: fresh })).status, 403);
  });

  test("demoted admin: old session fails even when the role is changed directly in MongoDB", async () => {
    const { user, email, password } = await createUser("admin");
    const cookie = await login(srv.base, email, password);
    await User.collection.updateOne({ _id: user._id }, { $set: { role: "editor" } }); // bypasses mongoose hooks
    assert.equal((await call(srv.base, "/admin/applications", { cookie })).status, 401);
  });

  test("password change signs out other sessions and keeps the current one", async () => {
    const { email, password } = await createUser("editor");
    const current = await login(srv.base, email, password);
    const other = await login(srv.base, email, password);
    const res = await call(srv.base, "/auth/password", { method: "POST", cookie: current, body: { currentPassword: password, newPassword: "a-brand-new-password" } });
    assert.equal(res.status, 200);
    const renewed = sessionCookie(res.setCookie);
    assert.equal((await adminGet(other)).status, 401);
    assert.equal((await adminGet(current)).status, 401);
    assert.equal((await adminGet(renewed)).status, 200);
  });
});

describe("BUG-02: editors don't receive applicant data", () => {
  test("admin dashboard includes submissions; editor dashboard omits them", async () => {
    const { Application } = await import("../modules/submissions/submissions.models");
    await Application.create({
      refCode: "PSH-26-TEST01", founderName: "Test Founder", email: "f@example.test", phone: "+91 98765 43210", city: "Pune",
      startupName: "Test Startup", sector: "Fintech", stage: "mvp", foundedYear: 2024, teamSize: 2, oneLiner: "x".repeat(12),
      description: "y".repeat(60), fundingAsk: "50L", pitchDeckUrl: "https://example.test/deck", consentAt: new Date(),
    });
    const admin = await createUser("admin");
    const editor = await createUser("editor");
    const a = await call(srv.base, "/admin/dashboard", { cookie: await login(srv.base, admin.email, admin.password) });
    assert.equal(a.status, 200);
    assert.equal(a.body.data.recentApplications.length, 1);
    assert.equal(a.body.data.applications.total, 1);

    const eCookie = await login(srv.base, editor.email, editor.password);
    const e = await call(srv.base, "/admin/dashboard", { cookie: eCookie });
    assert.equal(e.status, 200);
    for (const k of ["recentApplications", "applications", "investors", "messages"]) assert.ok(!(k in e.body.data), `editor must not get ${k}`);
    assert.ok(!JSON.stringify(e.body).includes("Test Founder"));
    assert.equal(typeof e.body.data.posts.published, "number");

    for (const p of ["/admin/applications", "/admin/applications/export.csv", "/admin/investor-interests", "/admin/messages"]) {
      assert.equal((await call(srv.base, p, { cookie: eCookie })).status, 403, p);
    }
  });
});
