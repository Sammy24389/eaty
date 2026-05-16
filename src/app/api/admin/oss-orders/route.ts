import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = parseInt(status);
  else where.status = { in: [1, 4, 7, 8, 10] };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderDatetime: "asc" },
    include: { orderItems: { include: { item: true } }, user: true },
  });

  return NextResponse.json({ data: orders });
}
