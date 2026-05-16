import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["paystack_secret_key"] } },
    });
    const secretKey = settings.find((s) => s.key === "paystack_secret_key")?.payload as string;

    if (secretKey) {
      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(JSON.stringify(body))
        .digest("hex");

      if (hash !== req.headers.get("x-paystack-signature")) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    if (event === "charge.success") {
      const data = body.data;
      const metadata = data.metadata;
      const orderId = metadata?.order_id;

      if (!orderId) {
        return NextResponse.json({ error: "No order ID in metadata" }, { status: 400 });
      }

      const order = await prisma.order.findUnique({
        where: { id: BigInt(orderId) },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      await prisma.$transaction([
        prisma.order.update({
          where: { id: BigInt(orderId) },
          data: {
            paymentStatus: 10,
            status: 2,
          },
        }),
        prisma.transaction.create({
          data: {
            orderId: BigInt(orderId),
            transactionNo: data.reference || `PAY-${Date.now()}`,
            amount: data.amount ? data.amount / 100 : order.total,
            paymentMethod: "paystack",
            sign: "+",
          },
        }),
      ]);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
