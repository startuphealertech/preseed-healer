import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ContactInputSchema, PhoneSchema } from "@preseedhealer/types";

describe("BUG-05: shared PhoneSchema (used by the forms and the API)", () => {
  const valid = ["+91 98765 43210", "9876543210", "+1 (555) 123-4567", "+44 20 7946 0958", "020.7946.0958", "+65 6123 4567", "+861012345678901"];
  const invalid = ["1-------", "12345", "1234567", "abcdefghij", "98765abcde", "", "   ", "1 ( ) ( ) -", "+91 98765 43210 ext 5", "++919876543210", "9876+543210", "1234567890123456"];

  for (const v of valid) test(`accepts ${JSON.stringify(v)}`, () => assert.ok(PhoneSchema.safeParse(v).success));
  for (const v of invalid) test(`rejects ${JSON.stringify(v)}`, () => {
    const r = PhoneSchema.safeParse(v);
    assert.ok(!r.success);
    assert.equal(r.error.issues[0]?.message, "Enter a valid phone number");
  });
  test("trims surrounding whitespace", () => assert.equal(PhoneSchema.parse("  9876543210 "), "9876543210"));
  test("optional phone on contact form: empty allowed, junk rejected", () => {
    const base = { name: "Test", email: "a@b.co", message: "Hello there, a message." };
    assert.ok(ContactInputSchema.safeParse({ ...base, phone: "" }).success);
    assert.ok(!ContactInputSchema.safeParse({ ...base, phone: "1-------" }).success);
  });
});
