import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId: session.user.id, session };
}

export async function requireRole(allowedRoles: string[]) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult;

  const user = await prisma.user.findUnique({
    where: { id: BigInt(authResult.userId) },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  const roleMapping = await prisma.role.findFirst({
    where: {
      modelHasRoles: {
        some: {
          modelType: "User",
          modelMorphKey: BigInt(authResult.userId),
        },
      },
    },
    select: { name: true },
  });

  const userRole = roleMapping?.name || "customer";

  if (!allowedRoles.includes(userRole)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: authResult.userId, user, role: userRole };
}
