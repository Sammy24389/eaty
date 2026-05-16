import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = req.nextUrl;
  const day = searchParams.get("day");

  const where: Record<string, unknown> = {};
  if (day) where.day = parseInt(day);

  const data = await prisma.timeSlot.findMany({ where, orderBy: [{ day: "asc" }, { openingTime: "asc" }] });
  return NextResponse.json({ data });
}
