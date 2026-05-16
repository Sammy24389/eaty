import { NextRequest, NextResponse } from "next/server";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

const timezones = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
  "Africa/Lagos", "Africa/Nairobi", "Africa/Accra", "Africa/Johannesburg",
];

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  return NextResponse.json({ data: timezones.map((tz) => ({ name: tz })) });
}
