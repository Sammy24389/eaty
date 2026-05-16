import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendOTP } from "@/lib/auth/otp";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);

  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { name, email, phone, username, password, countryCode } = body;

  if (!name || !username || !password) {
    return NextResponse.json(
      { error: "Name, username, and password are required" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        email ? { email } : {},
        { username },
        phone ? { phone } : {},
      ].filter((w) => Object.keys(w).length > 0),
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    if (existingUser.username === username) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    if (existingUser.phone === phone) {
      return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      username,
      password: hashedPassword,
      countryCode: countryCode || null,
      status: 5,
      isGuest: 10,
      branchId: BigInt(0),
      balance: 0,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      username: true,
      countryCode: true,
      status: true,
      createdAt: true,
    },
  });

  if (phone) {
    await sendOTP(phone);
  }

  return NextResponse.json(
    { message: "Registration successful", user },
    { status: 201 }
  );
}
