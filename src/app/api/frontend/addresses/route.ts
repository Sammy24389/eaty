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
    const address = await prisma.address.findFirst({ where: { id, userId: BigInt(authResult.userId) } });
    if (!address) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: address });
  }

  const data = await prisma.address.findMany({
    where: { userId: BigInt(authResult.userId) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const address = await prisma.address.create({
    data: { ...body, userId: BigInt(authResult.userId) },
  });
  return NextResponse.json({ data: address }, { status: 201 });
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
  const existing = await prisma.address.findFirst({ where: { id, userId: BigInt(authResult.userId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const address = await prisma.address.update({ where: { id }, data: body });
  return NextResponse.json({ data: address });
}

export async function DELETE(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.address.findFirst({ where: { id, userId: BigInt(authResult.userId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted successfully" });
}
