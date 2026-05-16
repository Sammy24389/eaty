import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const { email } = body;

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ message: "Already subscribed" });

  const subscriber = await prisma.subscriber.create({ data: { email } });
  return NextResponse.json({ data: subscriber }, { status: 201 });
}
