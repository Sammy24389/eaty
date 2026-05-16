import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = req.nextUrl;
  const group = searchParams.get("group");

  const where: Record<string, unknown> = {};
  if (group) where.group = group;

  const settings = await prisma.setting.findMany({ where });
  const data = Object.fromEntries(settings.map((s) => [s.key, s.payload]));
  return NextResponse.json({ data });
}
