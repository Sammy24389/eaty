import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { defaultLimiter } from "./middleware/rateLimit";

import authRoutes from "./routes/auth";
import frontendRoutes from "./routes/frontend";
import adminRoutes from "./routes/admin";
import paymentRoutes from "./routes/payment";
import webhookRoutes from "./routes/webhooks";
import profileRoutes from "./routes/profile";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(defaultLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/frontend", frontendRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/profile", profileRoutes);

// Webhooks need raw body for signature verification - mounted before JSON parser for those paths
app.use("/api/webhooks", express.json({ type: "application/json" }), webhookRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
