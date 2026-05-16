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

  const items = await prisma.orderItem.groupBy({
    by: ["itemId"],
    _count: { id: true },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: 50,
  });

  const itemIds = items.map((i) => i.itemId);
  const itemDetails = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, slug: true, price: true },
  });

  const data = items.map((i) => {
    const detail = itemDetails.find((d) => d.id === i.itemId);
    return { ...detail, orders: i._count.id, totalQuantity: i._sum.quantity, totalRevenue: i._sum.totalPrice };
  });

  return NextResponse.json({ data });
}
