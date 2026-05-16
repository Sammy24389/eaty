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

  const where: Record<string, unknown> = { deliveryBoyId: BigInt(authResult.userId) };

  const [data, total] = await Promise.all([
    prisma.order.findMany({ where, skip: (page - 1) * limit2, take: limit2, orderBy: { orderDatetime: "desc" } }),
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

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await req.json();
  const existing = await prisma.order.findFirst({
    where: { id: BigInt(id), deliveryBoyId: BigInt(authResult.userId) },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.update({ where: { id: BigInt(id) }, data: body });
  return NextResponse.json({ data: order });
}
