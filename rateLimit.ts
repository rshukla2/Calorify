// Rate limiter with in-memory storage
// Uses fixed windows for per-minute and per-day (UTC) limits

interface RateLimitOptions {
  perIpPerMinute?: number;
  perIpPerDay?: number;
  globalPerDay?: number;
  now?: () => number;
}

interface RateLimitState {
  perIpPerMinute: number;
  perIpPerDay: number;
  globalPerDay: number;
  now: () => number;
}

interface IpEntry {
  minuteWindow: number;
  minuteCount: number;
  dayWindow: number;
  dayCount: number;
}

interface GlobalEntry {
  dayWindow: number;
  count: number;
}

class RateLimiter {
  private options: RateLimitState;
  private ipEntries: Map<string, IpEntry>;
  private globalEntry: GlobalEntry | null = null;

  constructor(options: RateLimitOptions = {}) {
    this.options = {
      perIpPerMinute: options.perIpPerMinute ?? 5,
      perIpPerDay: options.perIpPerDay ?? 30,
      globalPerDay: options.globalPerDay ?? 150,
      now: options.now ?? (() => Date.now()),
    };
    this.ipEntries = new Map();
  }

  private getIpAddress(req: any): string {
    return req.ip || req.socket?.remoteAddress || "unknown";
  }

  private getMinuteWindow(now: number): number {
    // Fixed window: current minute boundary
    return Math.floor(now / 60000) * 60000;
  }

  private getDayWindow(now: number): number {
    // UTC day boundary
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
  }

  private pruneIfNeeded(): void {
    const now = this.options.now();
    const dayWindow = this.getDayWindow(now);

    // First, prune entries from previous days
    for (const [ip, entry] of this.ipEntries) {
      if (entry.dayWindow < dayWindow) {
        this.ipEntries.delete(ip);
      }
    }

    // Check if day rolled over and prune expired global entry
    if (this.globalEntry && this.globalEntry.dayWindow < dayWindow) {
      this.globalEntry = null;
    }

    // Prune when map is too large (keep newest entries)
    if (this.ipEntries.size > 5000) {
      // Convert to array and remove oldest entries (first ones added)
      const entries = Array.from(this.ipEntries.entries());
      const entriesToRemove = entries.slice(0, entries.length - 5000);
      for (const [ip, _entry] of entriesToRemove) {
        this.ipEntries.delete(ip);
      }
    }
  }

  public check(req: any): { allowed: boolean; retryAfter?: number; reason?: "minute" | "day" } {
    const now = this.options.now();
    const minuteWindow = this.getMinuteWindow(now);
    const dayWindow = this.getDayWindow(now);

    this.pruneIfNeeded();

    const ip = this.getIpAddress(req);
    let entry = this.ipEntries.get(ip);

    if (!entry) {
      entry = {
        minuteWindow,
        minuteCount: 0,
        dayWindow,
        dayCount: 0,
      };
      this.ipEntries.set(ip, entry);
    }

    // Reset windows if they've rolled over
    if (entry.minuteWindow !== minuteWindow) {
      entry.minuteWindow = minuteWindow;
      entry.minuteCount = 0;
    }
    if (entry.dayWindow !== dayWindow) {
      entry.dayWindow = dayWindow;
      entry.dayCount = 0;
    }

    // Initialize global entry if needed
    if (!this.globalEntry || this.globalEntry.dayWindow !== dayWindow) {
      this.globalEntry = {
        dayWindow,
        count: 0,
      };
    }

    // Check limits
    const minuteExceeded = entry.minuteCount >= this.options.perIpPerMinute;
    const dayExceeded = entry.dayCount >= this.options.perIpPerDay;
    const globalExceeded = this.globalEntry.count >= this.options.globalPerDay;

    if (minuteExceeded) {
      const retryAfter = Math.ceil((minuteWindow + 60000 - now) / 1000);
      return { allowed: false, retryAfter, reason: "minute" };
    }

    if (dayExceeded) {
      const retryAfter = Math.ceil((dayWindow + 86400000 - now) / 1000);
      return { allowed: false, retryAfter, reason: "day" };
    }

    if (globalExceeded) {
      const retryAfter = Math.ceil((this.globalEntry.dayWindow + 86400000 - now) / 1000);
      return { allowed: false, retryAfter, reason: "day" };
    }

    // All checks passed, increment counters
    entry.minuteCount++;
    entry.dayCount++;
    if (this.globalEntry) {
      this.globalEntry.count++;
    }

    return { allowed: true };
  }
}

export function createRateLimiter(opts: RateLimitOptions = {}) {
  const limiter = new RateLimiter(opts);

  return (req: any, res: any, next: any) => {
    const result = limiter.check(req);

    if (!result.allowed) {
      res.set("Retry-After", String(result.retryAfter ?? 60));
      return res.status(429).json({
        error:
          result.reason === "minute"
            ? "You're sending requests too quickly. Please wait a minute and try again."
            : "Calorify's AI demo has reached its daily limit. Please try again tomorrow or add food manually.",
        isRateLimit: true,
      });
    }

    next();
  };
}

export { RateLimiter };
