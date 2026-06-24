import { test, expect } from "vitest";
import { rateLimit, getClientIp, retryAfterSeconds } from "./rate-limit";

test("rateLimit allows up to the limit then blocks", () => {
  const key = `test:${Math.random()}`;
  const opts = { limit: 3, windowMs: 60_000 };
  expect(rateLimit(key, opts).success).toBe(true);
  expect(rateLimit(key, opts).success).toBe(true);
  expect(rateLimit(key, opts).success).toBe(true);
  const blocked = rateLimit(key, opts);
  expect(blocked.success).toBe(false);
  expect(blocked.remaining).toBe(0);
});

test("rateLimit resets after the window elapses", () => {
  const key = `test:${Math.random()}`;
  const opts = { limit: 1, windowMs: -1 }; // already-expired window
  expect(rateLimit(key, opts).success).toBe(true);
  // Previous window is in the past, so the next call starts fresh.
  expect(rateLimit(key, opts).success).toBe(true);
});

test("rateLimit keys are independent", () => {
  const opts = { limit: 1, windowMs: 60_000 };
  expect(rateLimit("a:1", opts).success).toBe(true);
  expect(rateLimit("b:1", opts).success).toBe(true);
  expect(rateLimit("a:1", opts).success).toBe(false);
});

test("getClientIp prefers first x-forwarded-for entry", () => {
  const req = new Request("https://x.test", {
    headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
  });
  expect(getClientIp(req)).toBe("1.2.3.4");
});

test("getClientIp falls back to unknown", () => {
  expect(getClientIp(new Request("https://x.test"))).toBe("unknown");
});

test("retryAfterSeconds is at least 1", () => {
  expect(retryAfterSeconds(Date.now() - 1000)).toBe(1);
  expect(retryAfterSeconds(Date.now() + 5000)).toBeGreaterThanOrEqual(5);
});
