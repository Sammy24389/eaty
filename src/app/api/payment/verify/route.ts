import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(orderId) },
      include: { transaction: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === 10) {
      return NextResponse.json({ success: true, order });
    }

    if (reference) {
      const settings = await prisma.setting.findMany({
        where: {
          key: { in: ["paystack_secret_key", "flutterwave_secret_key"] },
        },
      });
      const paystackKey = settings.find((s) => s.key === "paystack_secret_key")?.payload as string;
      const flutterwaveKey = settings.find((s) => s.key === "flutterwave_secret_key")?.payload as string;

      if (paystackKey) {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${paystackKey}` },
        });
        const data = await res.json();

        if (data.status && data.data.status === "success") {
          await prisma.$transaction([
            prisma.order.update({
              where: { id: BigInt(orderId) },
              data: { paymentStatus: 10, status: 2 },
            }),
            prisma.transaction.create({
              data: {
                orderId: BigInt(orderId),
                transactionNo: reference || `PAY-${Date.now()}`,
                amount: data.data.amount ? data.data.amount / 100 : order.total,
                paymentMethod: "paystack",
                sign: "+",
              },
            }),
          ]);

          return NextResponse.json({ success: true, order });
        }
      }

      if (flutterwaveKey) {
        const res = await fetch(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
          headers: { Authorization: `Bearer ${flutterwaveKey}` },
        });
        const data = await res.json();

        if (data.status === "success" && data.data.status === "successful") {
          await prisma.$transaction([
            prisma.order.update({
              where: { id: BigInt(orderId) },
              data: { paymentStatus: 10, status: 2 },
            }),
            prisma.transaction.create({
              data: {
                orderId: BigInt(orderId),
                transactionNo: reference || `FLW-${Date.now()}`,
                amount: data.data.amount || order.total,
                paymentMethod: "flutterwave",
                sign: "+",
              },
            }),
          ]);

          return NextResponse.json({ success: true, order });
        }
      }
    }

    return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
