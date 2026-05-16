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
    const item = await prisma.item.findUnique({ where: { id }, include: { category: true, tax: true, variations: true, extras: true, addons: true } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit2 = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");

  const where: Record<string, unknown> = {};
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }];
  if (status) where.status = parseInt(status);
  if (categoryId) where.itemCategoryId = BigInt(categoryId);

  const [data, total] = await Promise.all([
    prisma.item.findMany({ where, skip: (page - 1) * limit2, take: limit2, orderBy: { order: "asc" }, include: { category: true } }),
    prisma.item.count({ where }),
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
  const item = await prisma.item.create({ data: body });
  return NextResponse.json({ data: item }, { status: 201 });
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
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.item.update({ where: { id }, data: body });
  return NextResponse.json({ data: item });
}

export async function DELETE(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted successfully" });
}
