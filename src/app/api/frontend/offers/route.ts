import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const now = new Date();
  const data = await prisma.offer.findMany({
    where: { status: 5, startDate: { lte: now }, endDate: { gte: now } },
    include: { offerItems: { include: { item: true } } },
  });
  return NextResponse.json({ data });
}
