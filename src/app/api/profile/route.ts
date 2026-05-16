import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const user = await prisma.user.findUnique({
    where: { id: BigInt(authResult.userId) },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      username: true,
      countryCode: true,
      balance: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { name, phone, countryCode } = body;

  const updatedUser = await prisma.user.update({
    where: { id: BigInt(authResult.userId) },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(countryCode && { countryCode }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      username: true,
      countryCode: true,
      balance: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: updatedUser });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(authResult.userId) },
    select: { password: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: BigInt(authResult.userId) },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: "Password changed successfully" });
}
