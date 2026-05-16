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

  const userId = BigInt(authResult.userId);

  let conversation = await prisma.message.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (!conversation) {
    const firstBranch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });
    if (!firstBranch) return NextResponse.json({ data: [] });

    conversation = await prisma.message.create({
      data: { userId, branchId: firstBranch.id },
    });
  }

  const histories = await prisma.messageHistory.findMany({
    where: { messageId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  const formattedData = histories.map((h) => ({
    id: h.id.toString(),
    body: h.text || "",
    senderType: h.userId.toString() === authResult.userId ? "customer" : "admin",
    createdAt: h.createdAt.toISOString(),
  }));

  return NextResponse.json({ data: formattedData });
}

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const userId = BigInt(authResult.userId);

  let conversation = await prisma.message.findFirst({ where: { userId } });

  if (!conversation) {
    const firstBranch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });
    if (!firstBranch) return NextResponse.json({ error: "No branch found" }, { status: 400 });

    conversation = await prisma.message.create({
      data: { userId, branchId: firstBranch.id },
    });
  }

  const history = await prisma.messageHistory.create({
    data: {
      messageId: conversation.id,
      userId,
      text: body.body || body.text || "",
      isRead: 5,
    },
  });

  return NextResponse.json({
    data: {
      id: history.id.toString(),
      body: history.text,
      senderType: "customer",
      createdAt: history.createdAt.toISOString(),
    },
  }, { status: 201 });
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
  const existing = await prisma.message.findFirst({
    where: { id, userId: BigInt(authResult.userId) },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const msg = await prisma.message.update({ where: { id }, data: body });
  return NextResponse.json({ data: msg });
}

export async function DELETE(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const id = getId(req);
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.message.findFirst({
    where: { id, userId: BigInt(authResult.userId) },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.messageHistory.deleteMany({ where: { messageId: id } });
  await prisma.message.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted successfully" });
}
