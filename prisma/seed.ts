import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      id: BigInt(1),
      name: "Super Admin",
      email: "admin@foodappi.com",
      username: "admin",
      phone: "+1234567890",
      password: hashedPassword,
      status: 5,
      isGuest: 10,
      branchId: BigInt(0),
      balance: 0,
    },
  });
  console.log("Created admin user:", admin.email);

  const branch = await prisma.branch.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      id: BigInt(1),
      name: "Main Branch",
      email: "main@foodappi.com",
      phone: "+1234567890",
      city: "Default City",
      state: "Default State",
      zipCode: "00000",
      address: "123 Main Street",
      status: 5,
    },
  });
  console.log("Created default branch:", branch.name);

  const currency = await prisma.currency.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      id: BigInt(1),
      name: "US Dollar",
      symbol: "$",
      code: "USD",
      isCryptocurrency: 10,
      exchangeRate: BigInt(1),
    },
  });
  console.log("Created default currency:", currency.code);

  const language = await prisma.language.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      id: BigInt(1),
      name: "English",
      code: "en",
      displayMode: 5,
      status: 5,
    },
  });
  console.log("Created default language:", language.name);

  const gateways = [
    { name: "Cash On Delivery", slug: "cash-on-delivery", status: 5 },
    { name: "Paystack", slug: "paystack", status: 10 },
    { name: "Flutterwave", slug: "flutterwave", status: 10 },
    { name: "Stripe", slug: "stripe", status: 10 },
    { name: "PayPal", slug: "paypal", status: 10 },
  ];

  for (const gw of gateways) {
    await prisma.paymentGatewayConfig.upsert({
      where: { slug: gw.slug },
      update: {},
      create: {
        name: gw.name,
        slug: gw.slug,
        status: gw.status,
      },
    });
    console.log("  Payment gateway:", gw.name);
  }

  const smsGateways = [
    { name: "Twilio", slug: "twilio", status: 10 },
    { name: "Plivo", slug: "plivo", status: 10 },
    { name: "MessageBird", slug: "message-bird", status: 10 },
  ];

  for (const gw of smsGateways) {
    await prisma.smsGateway.upsert({
      where: { slug: gw.slug },
      update: {},
      create: {
        name: gw.name,
        slug: gw.slug,
        status: gw.status,
      },
    });
    console.log("  SMS gateway:", gw.name);
  }

  const socialLogins = [
    { name: "Google", slug: "google", status: 10 },
    { name: "Facebook", slug: "facebook", status: 10 },
    { name: "Apple", slug: "apple", status: 10 },
  ];

  for (const sl of socialLogins) {
    await prisma.socialLogin.upsert({
      where: { slug: sl.slug },
      update: {},
      create: {
        name: sl.name,
        slug: sl.slug,
        status: sl.status,
      },
    });
    console.log("  Social login:", sl.name);
  }

  const roles = [
    { id: BigInt(1), name: "admin", guardName: "api" },
    { id: BigInt(2), name: "customer", guardName: "api" },
    { id: BigInt(3), name: "delivery_boy", guardName: "api" },
    { id: BigInt(4), name: "waiter", guardName: "api" },
    { id: BigInt(5), name: "chef", guardName: "api" },
    { id: BigInt(6), name: "branch_manager", guardName: "api" },
    { id: BigInt(7), name: "pos_operator", guardName: "api" },
    { id: BigInt(8), name: "stuff", guardName: "api" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: {
        id: role.id,
        name: role.name,
        guardName: role.guardName,
      },
    });
    console.log("  Role:", role.name);
  }

  // Assign admin role to admin user
  await prisma.modelHasRole.upsert({
    where: {
      roleId_modelType_modelMorphKey: {
        roleId: BigInt(1),
        modelType: "User",
        modelMorphKey: BigInt(1),
      },
    },
    update: {},
    create: {
      roleId: BigInt(1),
      modelType: "User",
      modelMorphKey: BigInt(1),
    },
  });
  console.log("Assigned admin role to admin user");

  const settings = [
    { group: "company", key: "company_name", payload: "FoodAppi" },
    { group: "company", key: "company_email", payload: "info@foodappi.com" },
    { group: "company", key: "company_phone", payload: "+1234567890" },
    { group: "site", key: "site_title", payload: "FoodAppi - Food Delivery" },
    { group: "site", key: "site_logo", payload: "" },
    { group: "site", key: "site_favicon", payload: "" },
    { group: "order", key: "delivery_charge", payload: "5.00" },
    { group: "order", key: "minimum_order", payload: "10.00" },
    { group: "order", key: "tax_included", payload: "false" },
    { group: "otp", key: "otp_digit_limit", payload: "6" },
    { group: "otp", key: "otp_expire_time", payload: "10" },
    { group: "otp", key: "otp_type", payload: "5" },
  ];

  for (let i = 0; i < settings.length; i++) {
    const setting = settings[i];
    await prisma.setting.upsert({
      where: { id: BigInt(i + 1) },
      update: {},
      create: {
        id: BigInt(i + 1),
        group: setting.group,
        key: setting.key,
        payload: setting.payload as any,
      },
    });
  }
  console.log("Created default settings");

  const alerts = [
    { name: "order_place", language: "en", mailMessage: "New order placed", smsMessage: "New order placed", pushNotificationMessage: "New order placed", mail: 5, sms: 5, pushNotification: 5 },
    { name: "order_accept", language: "en", mailMessage: "Order accepted", smsMessage: "Order accepted", pushNotificationMessage: "Order accepted", mail: 5, sms: 5, pushNotification: 5 },
    { name: "order_reject", language: "en", mailMessage: "Order rejected", smsMessage: "Order rejected", pushNotificationMessage: "Order rejected", mail: 5, sms: 5, pushNotification: 5 },
    { name: "order_delivered", language: "en", mailMessage: "Order delivered", smsMessage: "Order delivered", pushNotificationMessage: "Order delivered", mail: 5, sms: 5, pushNotification: 5 },
  ];

  for (let i = 0; i < alerts.length; i++) {
    const alert = alerts[i];
    await prisma.notificationAlert.upsert({
      where: { id: BigInt(i + 1) },
      update: {},
      create: {
        id: BigInt(i + 1),
        name: alert.name,
        language: alert.language,
        mailMessage: alert.mailMessage,
        smsMessage: alert.smsMessage,
        pushNotificationMessage: alert.pushNotificationMessage,
        mail: alert.mail,
        sms: alert.sms,
        pushNotification: alert.pushNotification,
      },
    });
  }
  console.log("Created notification alerts");

  console.log("\nSeed complete!");
  console.log("\nDefault admin credentials:");
  console.log("  Email: admin@foodappi.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
