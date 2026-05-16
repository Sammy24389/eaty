import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyOTP } from "@/lib/auth/otp";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.auth.max, rateLimits.auth.window);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { email, phone, code, token, password } = body;

  if (!password) {
    return NextResponse.json({ error: "New password required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const identifier = email || phone;
  if (!identifier || !code || !token) {
    return NextResponse.json(
      { error: "Identifier, code, and token required" },
      { status: 400 }
    );
  }

  const otpResult = await verifyOTP(identifier, code, token);
  if (!otpResult.valid) {
    return NextResponse.json({ error: otpResult.error }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: email ? { email } : { phone },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: "Password reset successfully" });
}
