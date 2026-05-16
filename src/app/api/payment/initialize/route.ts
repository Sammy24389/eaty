import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRateLimitKey, checkRateLimit, rateLimits } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/auth/rbac";

export async function POST(req: NextRequest) {
  const key = getRateLimitKey(req, req.nextUrl.pathname);
  const limit = checkRateLimit(key, rateLimits.strict.max, rateLimits.strict.window);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const body = await req.json();
  const { orderId, gateway } = body;

  if (!orderId || !gateway) {
    return NextResponse.json({ error: "orderId and gateway required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: BigInt(orderId) },
    include: { user: true, branch: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const callbackUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/payment/verify?orderId=${orderId}`;

  if (gateway === "paystack") {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["paystack_secret_key", "paystack_public_key"] } },
    });
    const secretKey = settings.find((s) => s.key === "paystack_secret_key")?.payload as string;

    if (!secretKey) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
    }

    const amountInKobo = Number(order.total) * 100;

    try {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: order.user.email,
          amount: amountInKobo,
          callback_url: callbackUrl,
          metadata: {
            order_id: orderId,
            user_id: order.userId.toString(),
          },
        }),
      });

      const data = await res.json();

      if (!data.status) {
        return NextResponse.json({ error: data.message || "Paystack initialization failed" }, { status: 400 });
      }

      return NextResponse.json({
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      });
    } catch {
      return NextResponse.json({ error: "Failed to initialize Paystack" }, { status: 500 });
    }
  }

  if (gateway === "flutterwave") {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["flutterwave_secret_key", "flutterwave_public_key"] } },
    });
    const secretKey = settings.find((s) => s.key === "flutterwave_secret_key")?.payload as string;

    if (!secretKey) {
      return NextResponse.json({ error: "Flutterwave not configured" }, { status: 500 });
    }

    const txRef = `FLW-${Date.now()}-${orderId}`;

    try {
      const res = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: Number(order.total),
          currency: "NGN",
          redirect_url: callbackUrl,
          customer: {
            email: order.user.email,
            name: order.user.name || "Customer",
          },
          meta: {
            order_id: orderId,
            user_id: order.userId.toString(),
          },
        }),
      });

      const data = await res.json();

      if (data.status !== "success") {
        return NextResponse.json({ error: data.message || "Flutterwave initialization failed" }, { status: 400 });
      }

      return NextResponse.json({
        link: data.data.link,
        tx_ref: txRef,
      });
    } catch {
      return NextResponse.json({ error: "Failed to initialize Flutterwave" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported gateway" }, { status: 400 });
}
