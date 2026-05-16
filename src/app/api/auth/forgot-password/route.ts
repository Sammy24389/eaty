import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOTP } from "@/lib/auth/otp";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.auth.max, rateLimits.auth.window);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { email, phone } = body;

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Email or phone required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: email
      ? { email }
      : phone
        ? { phone }
        : {},
  });

  if (!user) {
    return NextResponse.json(
      { error: "No account found with those details" },
      { status: 404 }
    );
  }

  const identifier = email || phone!;
  const { token } = await sendOTP(identifier);

  return NextResponse.json({
    message: "Reset code sent",
    token,
  });
}
