/**
 * Test environment. Imported first by every integration test so `config/env` sees these values.
 * Uses a throwaway database on the local MongoDB (override with TEST_MONGODB_URI); it is dropped afterwards.
 */
process.env.NODE_ENV = "test";
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI ?? `mongodb://127.0.0.1:27017/preseedhealer_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test-only-jwt-secret-that-is-at-least-32-chars";
process.env.REVALIDATE_SECRET = "test-only-revalidate-secret";
process.env.WEB_URL = "http://127.0.0.1:9"; // revalidation calls go nowhere
process.env.SMTP_HOST = "";
process.env.NOTIFY_EMAILS = "";
process.env.TRUST_PROXY = "1"; // lets tests pick a client IP via X-Forwarded-For (separate rate-limit buckets)
