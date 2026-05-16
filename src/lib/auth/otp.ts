import { prisma } from "@/lib/db";
import crypto from "crypto";

export function generateOTP(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max).toString();
}

export async function sendOTP(phoneOrEmail: string) {
  const code = generateOTP(6);
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.otp.upsert({
    where: { phone: phoneOrEmail },
    update: { code, token },
    create: {
      phone: phoneOrEmail,
      code,
      token,
    },
  });

  console.log(`[OTP] Code for ${phoneOrEmail}: ${code} (token: ${token})`);

  return { token, code };
}

export async function verifyOTP(phoneOrEmail: string, code: string, token: string) {
  const otp = await prisma.otp.findUnique({
    where: { phone: phoneOrEmail },
  });

  if (!otp) {
    return { valid: false, error: "OTP not found" };
  }

  if (otp.token !== token) {
    return { valid: false, error: "Invalid token" };
  }

  if (otp.code !== code) {
    return { valid: false, error: "Invalid code" };
  }

  const createdAt = new Date(otp.createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

  if (diffMinutes > 10) {
    return { valid: false, error: "OTP expired" };
  }

  await prisma.otp.delete({
    where: { phone: phoneOrEmail },
  });

  return { valid: true };
}
