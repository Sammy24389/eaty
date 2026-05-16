import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/auth/register",
  "/api/auth/otp",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/social-login",
  "/manifest.json",
  "/images",
  "/_next",
];

const adminPaths = ["/admin"];

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const isAdminPath = adminPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isPublicPath && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && session?.user?.id) {
    const user = await fetchUserRole(session.user.id);
    if (user?.role !== "admin" && user?.role !== "branch_manager" && user?.role !== "pos_operator") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

async function fetchUserRole(userId: string) {
  try {
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true, name: true, email: true },
    });

    if (!user) return null;

    const roleMapping = await prisma.role.findFirst({
      where: {
        modelHasRoles: {
          some: {
            modelType: "User",
            modelMorphKey: BigInt(userId),
          },
        },
      },
      select: { name: true },
    });

    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: roleMapping?.name || "customer",
    };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
