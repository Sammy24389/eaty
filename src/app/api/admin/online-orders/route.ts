import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/auth/rbac";

function getId(req: NextRequest): bigint | null {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return null;
  try { return BigInt(id); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true, user: true, address: true, branch: true },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: order });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit2 = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const branchId = searchParams.get("branchId");

  const where: Record<string, unknown> = { source: "5" };
  if (status) where.status = parseInt(status);
  if (paymentStatus) where.paymentStatus = parseInt(paymentStatus);
  if (branchId) where.branchId = BigInt(branchId);

  const [data, total] = await Promise.all([
    prisma.order.findMany({ where, skip: (page - 1) * limit2, take: limit2, orderBy: { orderDatetime: "desc" }, include: { user: true, branch: true } }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit: limit2, total, totalPages: Math.ceil(total / limit2) } });
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
  const existing = await prisma.order.findUnique({ where: { id } });
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

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.orderItem.deleteMany({ where: { orderId: id } });
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted successfully" });
}
