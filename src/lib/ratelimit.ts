import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_WINDOW = 60 * 1000;
const DEFAULT_MAX = 100;

const STRICT_WINDOW = 60 * 1000;
const STRICT_MAX = 10;

const AUTH_WINDOW = 15 * 60 * 1000;
const AUTH_MAX = 5;

export function getRateLimitKey(req: NextRequest, path: string): string {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return `${ip}:${path}`;
}

export function checkRateLimit(key: string, max: number = DEFAULT_MAX, window: number = DEFAULT_WINDOW) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + window });
    return { allowed: true, remaining: max - 1, resetAt: now + window };
  }

  entry.count += 1;

  if (entry.count > max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { max?: number; window?: number } = {}
) {
  return async (req: NextRequest) => {
    const key = getRateLimitKey(req, req.nextUrl.pathname);
    const { max = DEFAULT_MAX, window = DEFAULT_WINDOW } = options;
    const limit = checkRateLimit(key, max, window);

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": max.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": limit.resetAt.toString(),
          },
        }
      );
    }

    const response = await handler(req);

    response.headers.set("X-RateLimit-Limit", max.toString());
    response.headers.set("X-RateLimit-Remaining", limit.remaining.toString());
    response.headers.set("X-RateLimit-Reset", limit.resetAt.toString());

    return response;
  };
}

export const rateLimits = {
  default: { max: DEFAULT_MAX, window: DEFAULT_WINDOW },
  strict: { max: STRICT_MAX, window: STRICT_WINDOW },
  auth: { max: AUTH_MAX, window: AUTH_WINDOW },
};
