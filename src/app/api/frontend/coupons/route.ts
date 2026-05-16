import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const { code } = body;

  if (!code) return NextResponse.json({ error: "Coupon code required" }, { status: 400 });

  const coupon = await prisma.coupon.findFirst({
    where: { code, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
  });

  if (!coupon) return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 404 });

  return NextResponse.json({ data: coupon });
}
