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
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = parseInt(status);
  else where.status = { in: [1, 4, 7, 8] };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderDatetime: "asc" },
    include: { orderItems: { include: { item: true } }, user: true, branch: true },
  });

  return NextResponse.json({ data: orders });
}

export async function PATCH(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await req.json();
  const existing = await prisma.order.findUnique({ where: { id: BigInt(id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.update({ where: { id: BigInt(id) }, data: body });
  return NextResponse.json({ data: order });
}
