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
  const page = parseInt(searchParams.get("page") || "1");
  const limit2 = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { userId: BigInt(authResult.userId) };
  if (status) where.status = parseInt(status);

  const [data, total] = await Promise.all([
    prisma.order.findMany({ where, skip: (page - 1) * limit2, take: limit2, orderBy: { createdAt: "desc" }, include: { orderItems: true } }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit: limit2, total, totalPages: Math.ceil(total / limit2) } });
}

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { items, branchId, orderType, deliveryTime, paymentMethod, address } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Items required" }, { status: 400 });
  }

  const order = await prisma.$transaction(async (tx) => {
    const subtotal = items.reduce((sum: number, item: Record<string, unknown>) => sum + Number(item.price) * (item.quantity as number), 0);

    const newOrder = await tx.order.create({
      data: {
        userId: BigInt(authResult.userId),
        branchId: BigInt(branchId),
        subtotal,
        discount: 0,
        deliveryCharge: 0,
        totalTax: 0,
        total: subtotal,
        orderType: orderType || 5,
        deliveryTime: deliveryTime || null,
        paymentMethod: BigInt(paymentMethod || 1),
        paymentStatus: 10,
        status: 1,
        source: "5",
      },
    });

    for (const item of items) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          branchId: BigInt(branchId),
          itemId: BigInt(item.itemId),
          quantity: item.quantity,
          discount: 0,
          price: item.price,
          instruction: item.instruction || null,
        },
      });
    }

    if (address) {
      await tx.orderAddress.create({
        data: {
          orderId: newOrder.id,
          userId: BigInt(authResult.userId),
          label: address.label || "Home",
          address: address.address,
          apartment: address.apartment || null,
          latitude: address.latitude,
          longitude: address.longitude,
        },
      });
    }

    return newOrder;
  });

  return NextResponse.json({ data: order }, { status: 201 });
}
