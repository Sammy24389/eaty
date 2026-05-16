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
  const group = searchParams.get("group");
  const key2 = searchParams.get("key");

  const where: Record<string, unknown> = {};
  if (group) where.group = group;
  if (key2) where.key = key2;

  const settings = await prisma.setting.findMany({ where, orderBy: [{ group: "asc" }, { key: "asc" }] });
  return NextResponse.json({ data: settings });
}

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { group, key: settingKey, payload } = body;

  if (!group || !settingKey || payload === undefined) {
    return NextResponse.json({ error: "group, key, and payload required" }, { status: 400 });
  }

  const setting = await prisma.setting.upsert({
    where: { id: BigInt(0) },
    update: { payload: payload as unknown as object },
    create: { group, key: settingKey, payload: payload as unknown as object },
  });

  return NextResponse.json({ data: setting });
}

export async function PATCH(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { group, key: settingKey, payload } = body;

  if (!group || !settingKey) {
    return NextResponse.json({ error: "group and key required" }, { status: 400 });
  }

  const existing = await prisma.setting.findFirst({ where: { group, key: settingKey } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const setting = await prisma.setting.update({
    where: { id: existing.id },
    data: { payload: payload as unknown as object },
  });

  return NextResponse.json({ data: setting });
}
