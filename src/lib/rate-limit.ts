const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function rateLimit(ip: string, opts: RateLimitOptions): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= opts.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfter };
  }

  entry.count++;
  return { ok: true, retryAfter: 0 };
}
