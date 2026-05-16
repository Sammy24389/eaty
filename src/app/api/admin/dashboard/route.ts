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
  const metric = searchParams.get("metric");

  if (metric === "total-sales") {
    const result = await prisma.order.aggregate({
      where: { paymentStatus: 5 },
      _sum: { total: true },
      _count: { id: true },
    });
    return NextResponse.json({ totalSales: result._sum.total || 0, orderCount: result._count.id });
  }

  if (metric === "total-orders") {
    const total = await prisma.order.count();
    const byStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    return NextResponse.json({ total, byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })) });
  }

  if (metric === "total-customers") {
    const total = await prisma.user.count({ where: { isGuest: 10 } });
    return NextResponse.json({ total });
  }

  if (metric === "total-menu-items") {
    const total = await prisma.item.count({ where: { status: 5 } });
    return NextResponse.json({ total });
  }

  if (metric === "order-statistics") {
    const orders = await prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { total: true },
    });
    return NextResponse.json({ data: orders });
  }

  if (metric === "top-customers") {
    const customers = await prisma.user.findMany({
      where: { isGuest: 10 },
      orderBy: { balance: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, phone: true, balance: true },
    });
    return NextResponse.json({ data: customers });
  }

  if (metric === "popular-items") {
    const items = await prisma.orderItem.groupBy({
      by: ["itemId"],
      _count: { id: true },
      _sum: { quantity: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const itemIds = items.map((i) => i.itemId);
    const itemDetails = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, slug: true, price: true },
    });

    const data = items.map((i) => {
      const detail = itemDetails.find((d) => d.id === i.itemId);
      return { ...detail, orders: i._count.id, totalQuantity: i._sum.quantity };
    });

    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
}
