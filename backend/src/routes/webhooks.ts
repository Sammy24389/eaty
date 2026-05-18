import { Router } from "express";
import crypto from "crypto";
import { prisma } from "../lib/db";

const router = Router();

// Disable body parser for webhook signature verification
router.post("/paystack", async (req, res) => {
  try {
    const body = req.body;
    const event = body.event;

    // Verify signature
    const setting = await prisma.setting.findFirst({ where: { key: "paystack_secret_key" } });
    if (setting?.payload) {
      const hash = crypto.createHmac("sha512", setting.payload as string).update(JSON.stringify(body)).digest("hex");
      if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    if (event === "charge.success") {
      const data = body.data;
      const orderId = data.metadata?.order_id;

      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: BigInt(orderId) } });
        if (order) {
          await prisma.order.update({
            where: { id: BigInt(orderId) },
            data: { paymentStatus: 10, status: 2 },
          });

          await prisma.transaction.create({
            data: {
              orderId: BigInt(orderId),
              transactionNo: data.reference || `PAY-${Date.now()}`,
              amount: data.amount ? data.amount / 100 : order.total,
              paymentMethod: "paystack",
              sign: "+",
            },
          });
        }
      }
    }

    res.json({ received: true });
  } catch {
    res.status(500).json({ error: "Webhook failed" });
  }
});

router.post("/flutterwave", async (req, res) => {
  try {
    const body = req.body;
    const event = body.event;

    // Verify signature
    const setting = await prisma.setting.findFirst({ where: { key: "flutterwave_secret_key" } });
    if (setting?.payload) {
      const hash = crypto.createHmac("sha256", setting.payload as string).update(JSON.stringify(body)).digest("hex");
      if (hash !== req.headers["verif-hash"]) {
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    if (event === "charge.completed") {
      const data = body.data;
      const orderId = data.meta?.order_id;

      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: BigInt(orderId) } });
        if (order) {
          await prisma.order.update({
            where: { id: BigInt(orderId) },
            data: { paymentStatus: 10, status: 2 },
          });

          await prisma.transaction.create({
            data: {
              orderId: BigInt(orderId),
              transactionNo: data.tx_ref || `FLW-${Date.now()}`,
              amount: data.amount || order.total,
              paymentMethod: "flutterwave",
              sign: "+",
            },
          });
        }
      }
    }

    res.json({ received: true });
  } catch {
    res.status(500).json({ error: "Webhook failed" });
  }
});

export default router;
