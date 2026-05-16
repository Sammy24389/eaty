import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/auth/rbac";
import { sendPushNotification } from "@/lib/push";

function getId(req: NextRequest): bigint | null {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return null;
  try { return BigInt(id); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { title, message, sendTo } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message required" }, { status: 400 });
  }

  const where: Record<string, unknown> = {};
  if (sendTo === "customers") where.role = "customer";
  else if (sendTo === "delivery_boys") where.role = "delivery_boy";

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, deviceToken: true, webToken: true },
  });

  const tokens = users
    .flatMap((u) => [u.deviceToken, u.webToken])
    .filter(Boolean) as string[];

  let pushResult = { success: 0, failure: 0 };
  if (tokens.length > 0) {
    pushResult = await sendPushNotification(tokens, title, message, {
      type: "notification",
      sendTo: sendTo || "all",
    });
  }

  const notifications = users.map((user) => ({
    modelType: "App\\Models\\User",
    modelId: user.id,
    data: JSON.stringify({ title, message }),
  }));

  await prisma.notification.createMany({ data: notifications });

  return NextResponse.json({
    data: {
      sent: notifications.length,
      pushSuccess: pushResult.success,
      pushFailure: pushResult.failure,
    },
  });
}

export async function GET(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.default.max, rateLimits.default.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (id) {
    const item = await prisma.notification.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit2 = parseInt(searchParams.get("limit") || "20");
  const read = searchParams.get("read");

  const where: Record<string, unknown> = {};
  if (read === "true") where.readAt = { not: null };
  else if (read === "false") where.readAt = null;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({ where, skip: (page - 1) * limit2, take: limit2, orderBy: { createdAt: "desc" } }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit: limit2, total, totalPages: Math.ceil(total / limit2) } });
}

export async function PATCH(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
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

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notification.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted successfully" });
}
