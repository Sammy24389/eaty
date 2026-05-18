import { Router } from "express";
import { prisma } from "../lib/db";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/initialize", authenticate, async (req, res) => {
  try {
    const { orderId, gateway } = req.body;
    if (!orderId || !gateway) return res.status(400).json({ error: "orderId and gateway required" });

    const order = await prisma.order.findUnique({
      where: { id: BigInt(orderId) },
      include: { user: true },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const callbackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/verify?orderId=${orderId}`;

    if (gateway === "paystack") {
      const setting = await prisma.setting.findFirst({ where: { key: "paystack_secret_key" } });
      const secretKey = setting?.payload as string;
      if (!secretKey) return res.status(500).json({ error: "Paystack not configured" });

      const amountInKobo = Number(order.total) * 100;
      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: order.user.email,
          amount: amountInKobo,
          callback_url: callbackUrl,
          metadata: { order_id: orderId, user_id: order.userId.toString() },
        }),
      });

      const data = await paystackRes.json() as { status: boolean; message: string; data: { authorization_url: string; access_code: string; reference: string } };
      if (!data.status) return res.status(400).json({ error: data.message });

      return res.json({ authorization_url: data.data.authorization_url, access_code: data.data.access_code, reference: data.data.reference });
    }

    if (gateway === "flutterwave") {
      const setting = await prisma.setting.findFirst({ where: { key: "flutterwave_secret_key" } });
      const secretKey = setting?.payload as string;
      if (!secretKey) return res.status(500).json({ error: "Flutterwave not configured" });

      const txRef = `FLW-${Date.now()}-${orderId}`;
      const fwRes = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: Number(order.total),
          currency: "NGN",
          redirect_url: callbackUrl,
          customer: { email: order.user.email, name: order.user.name || "Customer" },
          meta: { order_id: orderId, user_id: order.userId.toString() },
        }),
      });

      const data = await fwRes.json() as { status: string; message: string; data: { link: string } };
      if (data.status !== "success") return res.status(400).json({ error: data.message });

      return res.json({ link: data.data.link, tx_ref: txRef });
    }

    res.status(400).json({ error: "Unsupported gateway" });
  } catch {
    res.status(500).json({ error: "Failed to initialize payment" });
  }
});

router.get("/verify", async (req, res) => {
  try {
    const { reference, trxref, orderId } = req.query;
    if (!orderId) return res.status(400).json({ error: "Order ID required" });

    const order = await prisma.order.findUnique({ where: { id: BigInt(orderId as string) } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.paymentStatus === 10) return res.json({ success: true, order });

    const ref = (reference || trxref) as string;
    if (!ref) return res.status(400).json({ error: "No payment reference" });

    // Verify with Paystack
    const paystackSetting = await prisma.setting.findFirst({ where: { key: "paystack_secret_key" } });
    if (paystackSetting?.payload) {
      const payRes = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
        headers: { Authorization: `Bearer ${paystackSetting.payload}` },
      });
      const payData = await payRes.json() as { status: boolean; data: { status: string } };

      if (payData.status && payData.data.status === "success") {
        await prisma.order.update({ where: { id: BigInt(orderId as string) }, data: { paymentStatus: 10, status: 2 } });
        return res.json({ success: true });
      }
    }

    // Verify with Flutterwave
    const fwSetting = await prisma.setting.findFirst({ where: { key: "flutterwave_secret_key" } });
    if (fwSetting?.payload) {
      const fwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${ref}/verify`, {
        headers: { Authorization: `Bearer ${fwSetting.payload}` },
      });
      const fwData = await fwRes.json() as { status: string; data: { status: string } };

      if (fwData.status === "success" && fwData.data.status === "successful") {
        await prisma.order.update({ where: { id: BigInt(orderId as string) }, data: { paymentStatus: 10, status: 2 } });
        return res.json({ success: true });
      }
    }

    res.status(400).json({ error: "Payment not verified" });
  } catch {
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
