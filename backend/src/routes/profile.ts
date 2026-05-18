import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(req.user!.id) },
      select: { id: true, email: true, name: true, phone: true, status: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ data: { ...user, id: user.id.toString() } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/", async (req: AuthRequest, res) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: BigInt(req.user!.id) },
      data: { name, phone },
      select: { id: true, email: true, name: true, phone: true },
    });

    res.json({ data: { ...user, id: user.id.toString() } });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/change-password", async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password required" });
    }

    const user = await prisma.user.findUnique({ where: { id: BigInt(req.user!.id) } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: "Current password incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: BigInt(req.user!.id) },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password changed" });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
