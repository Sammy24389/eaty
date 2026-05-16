import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit2 = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");
  const featured = searchParams.get("featured");

  const where: Record<string, unknown> = { status: 5 };
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }];
  if (categoryId) where.itemCategoryId = BigInt(categoryId);
  if (featured === "true") where.isFeatured = 5;

  const [data, total] = await Promise.all([
    prisma.item.findMany({ where, skip: (page - 1) * limit2, take: limit2, orderBy: { order: "asc" }, include: { category: true } }),
    prisma.item.count({ where }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit: limit2, total, totalPages: Math.ceil(total / limit2) } });
}
