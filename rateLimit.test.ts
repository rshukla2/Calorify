import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRateLimiter, RateLimiter } from "./rateLimit";

describe("RateLimiter", () => {
  let clock: number;
  let limiter: RateLimiter;

  beforeEach(() => {
    clock = new Date("2024-01-15T12:00:00Z").getTime();
    limiter = new RateLimiter({
      now: () => clock,
      perIpPerMinute: 3,
      perIpPerDay: 10,
      globalPerDay: 20,
    });
  });

  const createMockReq = (ip: string) => ({
    ip,
    socket: { remoteAddress: ip },
    path: "/api/ai/test",
  });

  const createMockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  });

  const checkRateLimit = (req: any) => {
    const res = createMockRes();
    const next = vi.fn();
    limiter.check(req);
    return { res, next };
  };

  const checkMiddleware = (req: any) => {
    const res = createMockRes();
    const next = vi.fn();
    const middleware = createRateLimiter({
      now: () => clock,
      perIpPerMinute: 3,
      perIpPerDay: 10,
      globalPerDay: 20,
    });
    middleware(req, res, next);
    return { res, next };
  };

  describe("RateLimiter.check", () => {
    describe("per-ip per-minute limit", () => {
      it("allows requests up to the limit", () => {
        const req = createMockReq("192.168.1.1");

        for (let i = 0; i < 3; i++) {
          const result = limiter.check(req);
          expect(result.allowed).toBe(true);
        }
      });

      it("returns 429 when per-minute limit exceeded", () => {
        const req = createMockReq("192.168.1.1");

        // Use up the limit
        for (let i = 0; i < 3; i++) {
          limiter.check(req);
        }

        // Next request should be blocked
        const result = limiter.check(req);
        expect(result.allowed).toBe(false);
        expect(result.retryAfter).toBeGreaterThanOrEqual(0);
      });

      it("resets after the minute window passes", () => {
        const req = createMockReq("192.168.1.1");

        // Use up the limit
        for (let i = 0; i < 3; i++) {
          limiter.check(req);
        }

        // Advance clock to next minute
        clock = new Date("2024-01-15T12:01:00Z").getTime();

        const result = limiter.check(req);
        expect(result.allowed).toBe(true);
      });
    });

    describe("per-ip per-day limit", () => {
      it("returns 429 when per-day limit exceeded", () => {
        const req = createMockReq("192.168.1.1");

        // Use up the per-day limit (10)
        for (let i = 0; i < 10; i++) {
          limiter.check(req);
        }

        // Next request should be blocked by per-day limit
        const result = limiter.check(req);
        expect(result.allowed).toBe(false);
      });
    });

    describe("global per-day limit", () => {
      it("returns 429 when global limit exceeded across different IPs", () => {
        // Use up the global limit (20) with different IPs
        for (let i = 0; i < 20; i++) {
          const req = createMockReq(`192.168.1.${i}`);
          limiter.check(req);
        }

        // Next request from any IP should be blocked by global limit
        const req = createMockReq("10.0.0.1");
        const result = limiter.check(req);
        expect(result.allowed).toBe(false);
      });
    });

    describe("different IPs counted separately", () => {
      it("allows separate IPs up to their per-minute limits", () => {
        const req1 = createMockReq("192.168.1.1");
        const req2 = createMockReq("192.168.1.2");

        // Both should be allowed up to their individual limits
        for (let i = 0; i < 3; i++) {
          const result1 = limiter.check(req1);
          expect(result1.allowed).toBe(true);
        }

        for (let i = 0; i < 3; i++) {
          const result2 = limiter.check(req2);
          expect(result2.allowed).toBe(true);
        }
      });
    });

    describe("pruning", () => {
      it("prunes old entries when map exceeds 5000", () => {
        const limiter = new RateLimiter({
          now: () => clock,
          perIpPerMinute: 100,
          perIpPerDay: 100,
          globalPerDay: 1000,
        });

        // Fill with 5002 entries (one more than limit)
        for (let i = 0; i < 5002; i++) {
          const req = createMockReq(`192.168.1.${i}`);
          limiter.check(req);
        }

        // After adding 5002 entries, map has 5002 entries (one more than limit)
        // Now add one more - should trigger prune and reduce to 5001
        const req = createMockReq("10.0.0.1");
        limiter.check(req);

        // Old entries should be pruned (should be 5001 now)
        expect(limiter["ipEntries"].size).toBe(5001);
      });

      it("prunes entries from previous days", () => {
        const limiter = new RateLimiter({
          now: () => clock,
          perIpPerMinute: 100,
          perIpPerDay: 100,
          globalPerDay: 1000,
        });

        // Create some entries
        const req1 = createMockReq("192.168.1.1");
        limiter.check(req1);

        // Advance to next day
        clock = new Date("2024-01-16T12:00:00Z").getTime();

        // Add another entry - should prune old day's entries
        const req2 = createMockReq("192.168.1.2");
        limiter.check(req2);

        // The old entry should be pruned
        expect(limiter["ipEntries"].size).toBe(1);
        expect(limiter["ipEntries"].has("192.168.1.1")).toBe(false);
      });
    });
  });

  describe("Express middleware", () => {
    const createMiddlewareReq = (ip: string, path = "/api/ai/test") => ({
      ip,
      socket: { remoteAddress: ip },
      path,
    });

    const createMiddlewareRes = () => ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    });

    it("returns 429 with isRateLimit for per-minute limit exceeded", () => {
      const req = createMiddlewareReq("192.168.1.1");
      const middleware = createRateLimiter({
        now: () => clock,
        perIpPerMinute: 3,
        perIpPerDay: 10,
        globalPerDay: 20,
      });

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        const res = createMiddlewareRes();
        const next = vi.fn();
        middleware(req, res, next);
      }

      // Next request should be blocked
      const res = createMiddlewareRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: "You're sending requests too quickly. Please wait a minute and try again.",
        isRateLimit: true,
      });
      expect(res.set).toHaveBeenCalledWith("Retry-After", "60");
    });

    it("returns 429 with isRateLimit for per-day limit exceeded", () => {
      const req = createMiddlewareReq("192.168.1.1");
      const middleware = createRateLimiter({
        now: () => clock,
        perIpPerMinute: 100,
        perIpPerDay: 5,
        globalPerDay: 100,
      });

      // Use up the per-day limit
      for (let i = 0; i < 5; i++) {
        const res = createMiddlewareRes();
        const next = vi.fn();
        middleware(req, res, next);
      }

      // Next request should be blocked by per-day limit
      const res = createMiddlewareRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: "Calorify's AI demo has reached its daily limit. Please try again tomorrow or add food manually.",
        isRateLimit: true,
      });
      // At 12:00:00 UTC, 12 hours remain until end of day (43200 seconds)
      expect(res.set).toHaveBeenCalledWith("Retry-After", "43200");
    });

    it("returns 429 with isRateLimit for global limit exceeded", () => {
      const middleware = createRateLimiter({
        now: () => clock,
        perIpPerMinute: 100,
        perIpPerDay: 100,
        globalPerDay: 3,
      });

      // Use up the global limit with different IPs
      for (let i = 0; i < 3; i++) {
        const req = createMiddlewareReq(`192.168.1.${i}`);
        const res = createMiddlewareRes();
        const next = vi.fn();
        middleware(req, res, next);
      }

      // Next request should be blocked by global limit
      const req = createMiddlewareReq("10.0.0.1");
      const res = createMiddlewareRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: "Calorify's AI demo has reached its daily limit. Please try again tomorrow or add food manually.",
        isRateLimit: true,
      });
    });

    it("calls next() when rate limit is not exceeded", () => {
      const req = createMiddlewareReq("192.168.1.1");
      const middleware = createRateLimiter({
        now: () => clock,
        perIpPerMinute: 10,
        perIpPerDay: 100,
        globalPerDay: 1000,
      });

      const res = createMiddlewareRes();
      const next = vi.fn();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
