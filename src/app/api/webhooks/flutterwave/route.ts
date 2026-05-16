import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["flutterwave_secret_key"] } },
    });
    const secretKey = settings.find((s) => s.key === "flutterwave_secret_key")?.payload as string;

    if (secretKey) {
      const hash = crypto
        .createHmac("sha256", secretKey)
        .update(JSON.stringify(body))
        .digest("hex");

      if (hash !== req.headers.get("verif-hash")) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    if (event === "charge.completed" || event === "transfer.completed") {
      const data = body.data;
      const orderId = data.meta?.order_id;

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
            transactionNo: data.tx_ref || `FLW-${Date.now()}`,
            amount: data.amount || order.total,
            paymentMethod: "flutterwave",
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
