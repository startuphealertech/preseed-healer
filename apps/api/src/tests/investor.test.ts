import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { call, freshIp, startServer, type TestServer } from "./helpers";
import { InvestorInterest } from "../modules/submissions/submissions.models";

let srv: TestServer;
before(async () => (srv = await startServer()));
after(async () => srv.close());

const lead = (email: string, extra: Record<string, unknown> = {}) => ({
  name: "Test Investor", email, phone: "+91 98765 43210", investorType: "angel", ticketSize: "10l-50l",
  sectors: ["Fintech"], consent: true, ...extra,
});
const submit = (body: unknown) => call(srv.base, "/investor-interests", { method: "POST", body, ip: freshIp() });

describe("BUG-04: duplicate investor submissions", () => {
  test("same email twice → one record, friendly 409", async () => {
    assert.equal((await submit(lead("dup@example.test"))).status, 201);
    const second = await submit(lead("dup@example.test"));
    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, "DUPLICATE");
    assert.match(second.body.error.message, /already registered/i);
    assert.equal(await InvestorInterest.countDocuments({ email: "dup@example.test" }), 1);
  });

  test("email is normalised (case and whitespace)", async () => {
    assert.equal((await submit(lead("Mixed.Case@Example.test"))).status, 201);
    assert.equal((await submit(lead("  mixed.case@EXAMPLE.TEST  "))).status, 409);
    assert.equal(await InvestorInterest.countDocuments({ email: "mixed.case@example.test" }), 1);
  });

  test("concurrent identical submissions create exactly one record", async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => submit(lead("race@example.test"))));
    const codes = results.map((r) => r.status).sort();
    assert.deepEqual(codes, [201, 409, 409, 409, 409, 409]);
    assert.equal(await InvestorInterest.countDocuments({ email: "race@example.test" }), 1);
  });

  test("a pre-existing lead (created before the fix, no emailKey) also blocks a new one", async () => {
    await InvestorInterest.collection.insertOne({ ...lead("legacy@example.test"), consentAt: new Date(), status: "new" });
    assert.equal((await submit(lead("legacy@example.test"))).status, 409);
  });

  test("existing duplicate rows don't break the unique index", async () => {
    await InvestorInterest.collection.insertMany([
      { ...lead("old-dupe@example.test"), consentAt: new Date() },
      { ...lead("old-dupe@example.test"), consentAt: new Date() },
    ]);
    assert.equal(await InvestorInterest.countDocuments({ email: "old-dupe@example.test" }), 2);
    assert.equal((await submit(lead("fresh@example.test"))).status, 201);
  });

  test("emailKey is not exposed by the admin API shape", async () => {
    const doc = await InvestorInterest.findOne({ email: "dup@example.test" }).lean();
    assert.ok(doc && !("emailKey" in doc));
  });
});

describe("BUG-05: phone validation on the API", () => {
  for (const phone of ["1-------", "12345", "abcdefghij", "", "1 ( ) ( ) -", "+91 98765 4321a"]) {
    test(`rejects ${JSON.stringify(phone)}`, async () => {
      const res = await submit(lead(`p-${Math.random()}@example.test`, { phone }));
      assert.equal(res.status, 400);
      assert.ok(res.body.error.fields.phone);
    });
  }
  test("accepts a formatted international number", async () => {
    assert.equal((await submit(lead("intl@example.test", { phone: "+44 (20) 7946-0958" }))).status, 201);
  });
  test("contact form: phone stays optional but is validated when given", async () => {
    const base = { name: "Test", email: "c@example.test", subject: "general", message: "Hello there, a message." };
    assert.equal((await call(srv.base, "/contact", { method: "POST", body: { ...base, phone: "" }, ip: freshIp() })).status, 201);
    assert.equal((await call(srv.base, "/contact", { method: "POST", body: { ...base, phone: "1-------" }, ip: freshIp() })).status, 400);
  });
});
