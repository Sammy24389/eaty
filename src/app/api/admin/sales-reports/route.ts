import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = { paymentStatus: 5 };
  if (startDate) where.createdAt = { gte: new Date(startDate) };
  if (endDate) {
    const existing = where.createdAt as Record<string, Date> | undefined;
    if (existing) existing.lte = new Date(endDate);
    else where.createdAt = { lte: new Date(endDate) };
  }

  const overview = await prisma.order.aggregate({
    where,
    _sum: { total: true, subtotal: true, discount: true, deliveryCharge: true, totalTax: true },
    _count: { id: true },
  });

  const byStatus = await prisma.order.groupBy({
    by: ["status"],
    where,
    _count: { id: true },
    _sum: { total: true },
  });

  return NextResponse.json({ overview, byStatus });
}
