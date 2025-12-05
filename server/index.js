import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { sendStatusUpdate } from "./notifications/transportStatus.js";
import {
  sendNewQuoteAlert,
  sendQuoteConfirmationEmail,
} from "./notifications/adminAlerts.js";

import shipmentsRouter from "./routes/shipmentsRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "road-america-email-api" });
});

/**
 * POST /api/notifications/status
 * Body: { customerEmail, customerName, status, orderId }
 */
app.post("/api/notifications/status", async (req, res) => {
  try {
    const { customerEmail, customerName, status, orderId } = req.body;

    if (!customerEmail || !status || !orderId) {
      return res.status(400).json({
        success: false,
        message: "customerEmail, status, and orderId are required",
      });
    }

    const result = await sendStatusUpdate(
      customerEmail,
      customerName || "Customer",
      status,
      orderId
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send status email",
        error: result.error || result.err,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Status notification error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * POST /api/notifications/new-quote
 * Body: { name, email, phone, pickup, dropoff, vehicle, transportType, referenceId }
 */
app.post("/api/notifications/new-quote", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      pickup,
      dropoff,
      vehicle,
      transportType,
      referenceId,
    } = req.body;

    const [adminResult, customerResult] = await Promise.all([
      sendNewQuoteAlert({
        name,
        email,
        phone,
        pickup,
        dropoff,
        vehicle,
        transportType,
        referenceId,
      }),
      sendQuoteConfirmationEmail({
        name,
        email,
        pickup,
        dropoff,
        vehicle,
        transportType,
        referenceId,
      }),
    ]);

    if (!adminResult.success) {
      console.error("Admin alert failed:", adminResult.error || adminResult.err);
    }
    if (!customerResult.success) {
      console.error(
        "Customer confirmation failed:",
        customerResult.error || customerResult.err
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("New quote notification error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🔹 Mount shipments router here: this gives you /api/shipments
app.use("/api", shipmentsRouter)

app.listen(PORT, () => {
  console.log(`Email notification server running on port ${PORT}`);
});
