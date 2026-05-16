import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("slug");

  if (slug) {
    const page = await prisma.page.findFirst({ where: { slug, status: 5 } });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: page });
  }

  const data = await prisma.page.findMany({ where: { status: 5 }, orderBy: { title: "asc" } });
  return NextResponse.json({ data });
}
