import { Router } from "express";
import { prisma } from "../lib/db";
import { defaultLimiter, strictLimiter } from "../middleware/rateLimit";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/items", defaultLimiter, async (req, res) => {
  try {
    const { search, category, featured, limit = 20, page = 1 } = req.query;

    const where: Record<string, unknown> = { status: 5 };
    if (search) where.name = { contains: search as string, mode: "insensitive" };
    if (category) where.itemCategoryId = BigInt(category as string);
    if (featured) where.isFeatured = 1;

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: { category: true },
      }),
      prisma.item.count({ where }),
    ]);

    const formatted = data.map((item) => ({
      ...item,
      id: item.id.toString(),
      itemCategoryId: item.itemCategoryId.toString(),
      categoryName: item.category?.name,
      price: Number(item.price),
    }));

    res.json({
      data: formatted,
      meta: { page: Number(page), limit: Number(limit), total, lastPage: Math.ceil(total / Number(limit)) },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

router.get("/item-categories", defaultLimiter, async (req, res) => {
  try {
    const categories = await prisma.itemCategory.findMany({
      where: { status: 5 },
      orderBy: { sort: "asc" },
    });

    res.json({
      data: categories.map((c) => ({ ...c, id: c.id.toString() })),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/branches", defaultLimiter, async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({ where: { status: 5 } });
    res.json({ data: branches.map((b) => ({ ...b, id: b.id.toString() })) });
  } catch {
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

router.get("/sliders", defaultLimiter, async (req, res) => {
  try {
    const sliders = await prisma.slider.findMany({
      where: { status: 5 },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data: sliders.map((s) => ({ ...s, id: s.id.toString() })) });
  } catch {
    res.status(500).json({ error: "Failed to fetch sliders" });
  }
});

router.get("/offers", defaultLimiter, async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { status: 5, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    });
    res.json({ data: offers.map((o) => ({ ...o, id: o.id.toString(), amount: Number(o.amount) })) });
  } catch {
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

router.get("/pages", defaultLimiter, async (req, res) => {
  try {
    const { slug } = req.query;
    const where: Record<string, unknown> = { status: 5 };
    if (slug) where.slug = slug;

    const pages = await prisma.page.findMany({ where });
    res.json({ data: pages.map((p) => ({ ...p, id: p.id.toString() })) });
  } catch {
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

router.get("/settings", defaultLimiter, async (req, res) => {
  try {
    const { group } = req.query;
    const where: Record<string, unknown> = {};
    if (group) where.group = group;

    const settings = await prisma.setting.findMany({ where });
    res.json({ data: settings });
  } catch {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.get("/time-slots", defaultLimiter, async (req, res) => {
  try {
    const slots = await prisma.timeSlot.findMany({ orderBy: { day: "asc" } });
    res.json({ data: slots.map((s) => ({ ...s, id: s.id.toString() })) });
  } catch {
    res.status(500).json({ error: "Failed to fetch time slots" });
  }
});

router.get("/languages", defaultLimiter, async (req, res) => {
  try {
    const languages = await prisma.language.findMany({ where: { status: 5 } });
    res.json({ data: languages.map((l) => ({ ...l, id: l.id.toString() })) });
  } catch {
    res.status(500).json({ error: "Failed to fetch languages" });
  }
});

router.get("/country-codes", defaultLimiter, (_req, res) => {
  res.json({
    data: [
      { code: "+1", country: "US" },
      { code: "+44", country: "UK" },
      { code: "+234", country: "NG" },
      { code: "+91", country: "IN" },
    ],
  });
});

router.post("/contact", strictLimiter, async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    console.log("Contact form:", { name, email, phone, message });
    res.json({ message: "Message received" });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/subscribers", strictLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const existing = await prisma.subscriber.findFirst({ where: { email } });
    if (existing) return res.json({ message: "Already subscribed" });

    await prisma.subscriber.create({ data: { email } });
    res.status(201).json({ message: "Subscribed" });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/coupons", strictLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });

    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) return res.status(404).json({ error: "Invalid coupon" });

    res.json({
      data: {
        ...coupon,
        id: coupon.id.toString(),
        discount: Number(coupon.discount),
        minimumOrder: Number(coupon.minimumOrder),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// Protected routes
router.get("/orders", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = BigInt(req.user!.id);
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { address: true },
    });

    const formatted = orders.map((o) => ({
      ...o,
      id: o.id.toString(),
      userId: o.userId.toString(),
      total: Number(o.total),
      orderNumber: o.orderSerialNo,
    }));

    res.json({ data: formatted });
  } catch {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.post("/orders", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = BigInt(req.user!.id);
    const { items, name, phone, address, city, branch, paymentMethod, instruction, coupon, total } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items required" });
    }

    const firstBranch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });
    if (!firstBranch) return res.status(400).json({ error: "No branch available" });

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const paymentMethodMap: Record<string, bigint> = { cod: BigInt(1), paystack: BigInt(2), flutterwave: BigInt(3) };

    const order = await prisma.order.create({
      data: {
        orderSerialNo: orderNumber,
        userId,
        branchId: firstBranch.id,
        orderType: 5,
        status: 1,
        paymentMethod: paymentMethodMap[paymentMethod] || BigInt(1),
        paymentStatus: paymentMethod === "cod" ? 10 : 5,
        subtotal: total || 0,
        total: total || 0,
        orderDatetime: new Date(),
        orderItems: {
          create: items.map((item: { itemId: string; quantity: number }) => ({
            itemId: BigInt(item.itemId),
            branchId: firstBranch.id,
            quantity: item.quantity,
            price: 0,
            discount: 0,
            total: 0,
          })),
        },
        address: {
          create: {
            userId,
            label: name || "Delivery",
            address: `${address}, ${city}`,
            latitude: "0",
            longitude: "0",
          },
        },
      },
      include: { orderItems: true },
    });

    res.status(201).json({ data: { ...order, id: order.id.toString(), orderNumber } });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/addresses", authenticate, async (req: AuthRequest, res) => {
  try {
    const addresses = await prisma.orderAddress.findMany({
      where: { userId: BigInt(req.user!.id) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: addresses.map((a) => ({ ...a, id: a.id.toString(), userId: a.userId.toString() })) });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/addresses", authenticate, async (req: AuthRequest, res) => {
  try {
    const address = await prisma.orderAddress.create({
      data: { ...req.body, userId: BigInt(req.user!.id) },
    });
    res.status(201).json({ data: { ...address, id: address.id.toString() } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/device-token", authenticate, async (req: AuthRequest, res) => {
  try {
    const { token, type } = req.body;
    const updateData = type === "web" ? { webToken: token } : { deviceToken: token };
    await prisma.user.update({ where: { id: BigInt(req.user!.id) }, data: updateData });
    res.json({ message: "Token saved" });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/messages", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = BigInt(req.user!.id);
    let conversation = await prisma.message.findFirst({ where: { userId } });

    if (!conversation) {
      const branch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });
      if (!branch) return res.json({ data: [] });
      conversation = await prisma.message.create({ data: { userId, branchId: branch.id } });
    }

    const histories = await prisma.messageHistory.findMany({
      where: { messageId: conversation.id },
      orderBy: { createdAt: "asc" },
    });

    const formatted = histories.map((h) => ({
      id: h.id.toString(),
      body: h.text || "",
      senderType: h.userId.toString() === req.user!.id ? "customer" : "admin",
      createdAt: h.createdAt.toISOString(),
    }));

    res.json({ data: formatted });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/messages", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = BigInt(req.user!.id);
    let conversation = await prisma.message.findFirst({ where: { userId } });

    if (!conversation) {
      const branch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });
      if (!branch) return res.status(400).json({ error: "No branch" });
      conversation = await prisma.message.create({ data: { userId, branchId: branch.id } });
    }

    const history = await prisma.messageHistory.create({
      data: { messageId: conversation.id, userId, text: req.body.body || req.body.text || "", isRead: 5 },
    });

    res.status(201).json({
      data: { id: history.id.toString(), body: history.text, senderType: "customer", createdAt: history.createdAt.toISOString() },
    });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
