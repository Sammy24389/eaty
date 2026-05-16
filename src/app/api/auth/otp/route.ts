import { NextRequest, NextResponse } from "next/server";
import { sendOTP, verifyOTP } from "@/lib/auth/otp";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { phone, action } = body;

  if (!phone) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  if (action === "verify") {
    const { code, token } = body;
    if (!code || !token) {
      return NextResponse.json({ error: "Code and token required" }, { status: 400 });
    }

    const result = await verifyOTP(phone, code, token);

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "OTP verified successfully" });
  }

  const { token } = await sendOTP(phone);

  return NextResponse.json({
    message: "OTP sent",
    token,
  });
}
