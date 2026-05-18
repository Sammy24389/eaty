import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      roleType: payload.roleType as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getUserFromToken();
  if (!user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId: user.id, user, session: { user } };
}

export async function requireRole(allowedRoles: string[]) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult;

  const userRole = (authResult.user as any).roleType || "customer";

  if (!allowedRoles.includes(userRole)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: authResult.userId, user: authResult.user, role: userRole };
}
