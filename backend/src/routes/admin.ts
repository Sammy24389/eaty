import { Router } from "express";
import { prisma } from "../lib/db";
import { authenticate, requireRole } from "../middleware/auth";
import { defaultLimiter, strictLimiter } from "../middleware/rateLimit";

const router = Router();

router.use(authenticate);

// Dashboard
router.get("/dashboard", defaultLimiter, async (req, res) => {
  try {
    const [totalOrders, totalSales, totalCustomers, totalItems] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.user.count({ where: { isGuest: 10 } }),
      prisma.item.count(),
    ]);

    res.json({
      data: {
        totalOrders,
        totalSales: Number(totalSales._sum.total || 0),
        totalCustomers,
        totalItems,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// Generic CRUD helper
function createCrudRouter(model: string, idField = "id") {
  const r = Router();

  r.get("/", defaultLimiter, async (req, res) => {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const where: Record<string, unknown> = {};
      if (search) where.name = { contains: search as string, mode: "insensitive" };
      if (status) where.status = status;

      const skip = (Number(page) - 1) * Number(limit);
      const [data, total] = await Promise.all([
        (prisma as any)[model].findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" } }),
        (prisma as any)[model].count({ where }),
      ]);

      const formatted = data.map((item: any) => {
        const result = { ...item };
        if (result.id) result.id = result.id.toString();
        if (result.userId) result.userId = result.userId.toString();
        if (result.branchId) result.branchId = result.branchId.toString();
        return result;
      });

      res.json({
        data: formatted,
        meta: { page: Number(page), limit: Number(limit), total, lastPage: Math.ceil(total / Number(limit)) },
      });
    } catch {
      res.status(500).json({ error: `Failed to fetch ${model}` });
    }
  });

  r.post("/", strictLimiter, async (req, res) => {
    try {
      const item = await (prisma as any)[model].create({ data: req.body });
      const result = { ...item, id: item.id?.toString() };
      res.status(201).json({ data: result });
    } catch {
      res.status(500).json({ error: `Failed to create ${model}` });
    }
  });

  r.patch("/:id", strictLimiter, async (req, res) => {
    try {
      const id = BigInt(req.params.id as string);
      const item = await (prisma as any)[model].update({ where: { [idField]: id }, data: req.body });
      res.json({ data: { ...item, id: item.id?.toString() } });
    } catch {
      res.status(500).json({ error: `Failed to update ${model}` });
    }
  });

  r.delete("/:id", strictLimiter, async (req, res) => {
    try {
      const id = BigInt(req.params.id as string);
      await (prisma as any)[model].delete({ where: { [idField]: id } });
      res.json({ message: "Deleted" });
    } catch {
      res.status(500).json({ error: `Failed to delete ${model}` });
    }
  });

  return r;
}

// Register CRUD routes
router.use("/items", createCrudRouter("item"));
router.use("/item-categories", createCrudRouter("itemCategory"));
router.use("/branches", createCrudRouter("branch"));
router.use("/customers", createCrudRouter("user"));
router.use("/delivery-boys", createCrudRouter("user"));
router.use("/coupons", createCrudRouter("coupon"));
router.use("/offers", createCrudRouter("offer"));
router.use("/sliders", createCrudRouter("slider"));
router.use("/pages", createCrudRouter("page"));
router.use("/roles", createCrudRouter("role"));
router.use("/currencies", createCrudRouter("currency"));
router.use("/taxes", createCrudRouter("tax"));
router.use("/time-slots", createCrudRouter("timeSlot"));
router.use("/languages", createCrudRouter("language"));
router.use("/subscribers", createCrudRouter("subscriber"));
router.use("/messages", createCrudRouter("message"));
router.use("/notifications", createCrudRouter("notification"));
router.use("/payment-gateways", createCrudRouter("paymentGateway"));
router.use("/sms-gateways", createCrudRouter("smsGateway"));
router.use("/social-logins", createCrudRouter("socialLogin"));
router.use("/menu-sections", createCrudRouter("menuSection"));
router.use("/menu-templates", createCrudRouter("menuTemplate"));
router.use("/item-addons", createCrudRouter("itemAddon"));
router.use("/item-extras", createCrudRouter("itemExtra"));
router.use("/item-variations", createCrudRouter("itemVariation"));
router.use("/item-attributes", createCrudRouter("itemAttribute"));
router.use("/offer-items", createCrudRouter("offerItem"));
router.use("/push-notifications", createCrudRouter("pushNotification"));
router.use("/notification-alerts", createCrudRouter("notificationAlert"));
router.use("/otp-settings", createCrudRouter("otpSetting"));
router.use("/whatsapp", createCrudRouter("whatsapp"));
router.use("/pwa", createCrudRouter("pwaSetting"));
router.use("/pos-categories", createCrudRouter("posCategory"));

// Settings (GET/POST)
router.get("/settings", async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    res.json({ data: settings });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/settings", async (req, res) => {
  try {
    const { settings } = req.body;
    if (settings && typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) {
        const existing = await prisma.setting.findFirst({ where: { key } });
        if (existing) {
          await prisma.setting.update({ where: { id: existing.id }, data: { payload: value as any } });
        } else {
          await prisma.setting.create({ data: { key, payload: value as any, group: "general" } });
        }
      }
    }
    res.json({ message: "Settings saved" });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// Orders
router.get("/online-orders", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where: Record<string, unknown> = { orderType: 5 };
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" }, include: { address: true } }),
      prisma.order.count({ where }),
    ]);

    const formatted = data.map((o) => ({
      ...o,
      id: o.id.toString(),
      userId: o.userId.toString(),
      branchId: o.branchId.toString(),
      total: Number(o.total),
      orderNumber: o.orderSerialNo,
      customerName: o.address?.label || "Customer",
    }));

    res.json({ data: formatted, meta: { page: Number(page), limit: Number(limit), total, lastPage: Math.ceil(total / Number(limit)) } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/online-orders/:id", async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: BigInt(req.params.id as string) },
      data: req.body,
    });
    res.json({ data: { ...order, id: order.id.toString() } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// KDS Orders
router.get("/kds-orders", async (req, res) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = { orderType: 5 };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: { address: true, orderItems: { include: { item: true } } },
    });

    const formatted = orders.map((o) => ({
      ...o,
      id: o.id.toString(),
      orderNumber: o.orderSerialNo,
      customerName: o.address?.label || "Customer",
    }));

    res.json({ data: formatted });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/kds-orders/:id", async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: BigInt(req.params.id as string) },
      data: req.body,
    });
    res.json({ data: { ...order, id: order.id.toString() } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// POS Orders
router.get("/pos-orders", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const where: Record<string, unknown> = { orderType: 15 };
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" }, include: { address: true } }),
      prisma.order.count({ where }),
    ]);

    const formatted = data.map((o) => ({
      ...o,
      id: o.id.toString(),
      orderNumber: o.orderSerialNo,
      customerName: o.address?.label || "Walk-in",
    }));

    res.json({ data: formatted, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/pos-orders", async (req, res) => {
  try {
    const { items, customerName, paymentMethod, subtotal, tax, total, cashReceived } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Items required" });

    const firstUser = await prisma.user.findFirst({ orderBy: { id: "asc" } });
    const firstBranch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });
    if (!firstUser || !firstBranch) return res.status(400).json({ error: "Setup required" });

    const paymentMethodMap: Record<string, number> = { cash: 1, card: 2, other: 3 };

    const order = await prisma.order.create({
      data: {
        orderSerialNo: `POS-${Date.now().toString().slice(-6)}`,
        userId: firstUser.id,
        branchId: firstBranch.id,
        orderType: 15,
        status: 1,
        paymentMethod: BigInt(paymentMethodMap[paymentMethod] || 1),
        posPaymentMethod: paymentMethodMap[paymentMethod] || 1,
        paymentStatus: 10,
        subtotal: subtotal || 0,
        totalTax: tax || 0,
        total: total || 0,
        posReceivedAmount: cashReceived || total || 0,
        orderDatetime: new Date(),
        orderItems: {
          create: items.map((item: { itemId: string; quantity: number; price: number }) => ({
            itemId: BigInt(item.itemId),
            branchId: firstBranch.id,
            quantity: item.quantity,
            price: item.price,
            discount: 0,
            total: item.price * item.quantity,
          })),
        },
        address: {
          create: {
            userId: firstUser.id,
            label: customerName || "Walk-in Customer",
            address: "POS Order",
            latitude: "0",
            longitude: "0",
          },
        },
      },
      include: { orderItems: true, address: true },
    });

    res.status(201).json({ data: { ...order, orderNumber: order.orderSerialNo, id: order.id.toString() } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// Reports
router.get("/sales-reports", async (req, res) => {
  try {
    const { start, end } = req.query;
    const where: Record<string, unknown> = { orderType: 5 };
    if (start || end) {
      where.createdAt = {};
      if (start) (where.createdAt as any).gte = new Date(start as string);
      if (end) (where.createdAt as any).lte = new Date(end as string);
    }

    const [count, sum] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({ where, _sum: { total: true } }),
    ]);

    res.json({ data: { total: Number(sum._sum.total || 0), count } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/items-reports", async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      select: { name: true, _count: { select: { orderItems: true } } },
      orderBy: { orderItems: { _count: "desc" } },
      take: 20,
    });

    res.json({
      data: items.map((i) => ({ name: i.name, quantity: i._count.orderItems, revenue: "0" })),
    });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ data: transactions.map((t) => ({ ...t, id: t.id.toString(), orderId: t.orderId.toString() })) });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// Country codes
router.get("/country-codes", (_req, res) => {
  res.json({
    data: [
      { code: "+1", country: "US" },
      { code: "+44", country: "UK" },
      { code: "+234", country: "NG" },
    ],
  });
});

router.get("/timezones", (_req, res) => {
  const timezones = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
    "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai",
    "Australia/Sydney", "Pacific/Auckland",
  ];
  res.json({ data: timezones });
});

export default router;
