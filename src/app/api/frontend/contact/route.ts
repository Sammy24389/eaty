import { NextRequest, NextResponse } from "next/server";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const { name, email, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message required" }, { status: 400 });
  }

  console.log(`[Contact] Message from ${name} (${email}): ${message}`);

  return NextResponse.json({ message: "Message sent successfully" });
}
