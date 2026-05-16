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

  const data = await prisma.setting.findMany({ where: { group: "otp" } });
  return NextResponse.json({ data: Object.fromEntries(data.map((s) => [s.key, s.payload])) });
}

export async function PATCH(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const updates = Object.entries(body).map(([key, payload]) =>
    prisma.setting.upsert({
      where: { id: BigInt(0) },
      update: { payload: payload as unknown as object },
      create: { group: "otp", key, payload: payload as unknown as object },
    })
  );

  await prisma.$transaction(updates);
  return NextResponse.json({ message: "OTP settings updated" });
}
