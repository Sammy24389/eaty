import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/auth/rbac";

function getId(req: NextRequest): bigint | null {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return null;
  try { return BigInt(id); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { items, customerName, paymentMethod, subtotal, tax, total, cashReceived } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Items required" }, { status: 400 });
  }

  const orderSerialNo = `POS-${Date.now().toString().slice(-6)}`;

  const firstUser = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  const firstBranch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });

  if (!firstUser || !firstBranch) {
    return NextResponse.json({ error: "No user or branch found" }, { status: 400 });
  }

  const paymentMethodMap: Record<string, number> = { cash: 1, card: 2, other: 3 };

  const order = await prisma.order.create({
    data: {
      orderSerialNo,
      userId: firstUser.id,
      branchId: firstBranch.id,
      orderType: 15,
      status: 1,
      paymentMethod: BigInt(paymentMethodMap[paymentMethod] || 1),
      posPaymentMethod: paymentMethodMap[paymentMethod] || 1,
      paymentStatus: 10,
      subtotal: subtotal || 0,
      totalTax: tax || 0,
      total: total || 0,
      posReceivedAmount: cashReceived || total || 0,
      orderDatetime: new Date(),
      orderItems: {
        create: items.map((item: { itemId: string; quantity: number; price: number }) => ({
          itemId: BigInt(item.itemId),
          branchId: firstBranch.id,
          quantity: item.quantity,
          price: item.price,
          discount: 0,
          total: item.price * item.quantity,
        })),
      },
      address: {
        create: {
          userId: firstUser.id,
          label: customerName || "Walk-in Customer",
          address: "POS Order",
          latitude: "0",
          longitude: "0",
        },
      },
    },
    include: { orderItems: true, address: true },
  });

  return NextResponse.json({ data: { ...order, orderNumber: order.orderSerialNo } }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (id) {
    const order = await prisma.order.findUnique({ where: { id, orderType: 15 }, include: { orderItems: true, user: true, branch: true } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: order });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit2 = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { orderType: 15 };
  if (status) where.status = parseInt(status);

  const [data, total] = await Promise.all([
    prisma.order.findMany({ where, skip: (page - 1) * limit2, take: limit2, orderBy: { orderDatetime: "desc" }, include: { user: true, address: true } }),
    prisma.order.count({ where }),
  ]);

  const formattedData = data.map((order) => ({
    ...order,
    orderNumber: order.orderSerialNo,
    customerName: order.address?.label || "Walk-in Customer",
    createdAt: order.createdAt,
  }));

  return NextResponse.json({ data: formattedData, pagination: { page, limit: limit2, total, totalPages: Math.ceil(total / limit2) } });
}

export async function PATCH(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await req.json();
  const existing = await prisma.order.findUnique({ where: { id, orderType: 15 } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.update({ where: { id }, data: body });
  return NextResponse.json({ data: order });
}

export async function DELETE(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { id, orderType: 15 } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.orderItem.deleteMany({ where: { orderId: id } });
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted successfully" });
}
