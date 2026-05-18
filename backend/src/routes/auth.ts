import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { authLimiter, strictLimiter } from "../middleware/rateLimit";
import { generateToken } from "../middleware/auth";

const router = Router();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/register", authLimiter, async (req, res) => {
  try {
    const { email, password, name, phone, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: email }] },
    });

    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split("@")[0],
        username: username || email.split("@")[0],
        phone: phone || null,
        status: 5,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      data: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
        status: 5,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.json({
      data: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/otp", strictLimiter, async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone required" });
    }

    if (code) {
      const storedOTP = await prisma.otp.findFirst({
        where: { phone, code },
        orderBy: { createdAt: "desc" },
      });

      if (!storedOTP) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      return res.json({ message: "OTP verified" });
    }

    const otpCode = generateOTP();

    await prisma.otp.upsert({
      where: { phone },
      update: { code: otpCode, createdAt: new Date() },
      create: { phone, code: otpCode, token: `tok_${Date.now()}` },
    });

    console.log(`OTP for ${phone}: ${otpCode}`);

    res.json({ message: "OTP sent" });
  } catch (error) {
    console.error("OTP error:", error);
    res.status(500).json({ error: "OTP failed" });
  }
});

router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.json({ message: "If email exists, OTP sent" });

    const code = generateOTP();
    await prisma.otp.upsert({
      where: { phone: email },
      update: { code, createdAt: new Date() },
      create: { phone: email, code, token: `tok_${Date.now()}` },
    });

    console.log(`Password reset OTP for ${email}: ${code}`);
    res.json({ message: "Reset OTP sent" });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ error: "Email, OTP, and password required" });
    }

    const storedOTP = await prisma.otp.findFirst({
      where: { phone: email, code },
      orderBy: { createdAt: "desc" },
    });

    if (!storedOTP) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ error: "Reset failed" });
  }
});

export default router;
