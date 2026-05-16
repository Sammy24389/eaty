import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.auth.max, rateLimits.auth.window);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { provider, token } = body;

  if (!provider || !token) {
    return NextResponse.json(
      { error: "Provider and token required" },
      { status: 400 }
    );
  }

  const socialLogin = await prisma.socialLogin.findFirst({
    where: { slug: provider, status: 5 },
  });

  if (!socialLogin) {
    return NextResponse.json(
      { error: "Social login not configured" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: "Social login integration pending configuration", provider },
    { status: 501 }
  );
}
