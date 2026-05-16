import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/auth/rbac";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { type, token } = body;

  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const updateData = type === "web" ? { webToken: token } : { deviceToken: token };

  await prisma.user.update({
    where: { id: BigInt(authResult.userId) },
    data: updateData,
  });

  return NextResponse.json({ message: "Token saved" });
}
