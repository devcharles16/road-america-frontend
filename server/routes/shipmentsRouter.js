import express from "express";
import { requireAuth, requireRole, requireOneOf } from "../middleware/auth.js";


const router = express.Router();

/**
 * TEMP in-memory storage.
 * This resets whenever the server restarts.
 */
let shipments = [];

function generateId() {
  return Math.random().toString(36).slice(2);
}

/* =========================================================
   PUBLIC ROUTES
   ========================================================= */

/**
 * PUBLIC: Create a new transport request (quote submission)
 * POST /api/shipments
 */
router.post("/shipments", async (req, res) => {
  try {
    const input = req.body;
    const now = new Date().toISOString();

    const newShipment = {
      id: generateId(),
      referenceId: input.referenceId || `RA-${Date.now()}`,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone ?? null,
      pickupCity: input.pickupCity,
      pickupState: input.pickupState,
      deliveryCity: input.deliveryCity,
      deliveryState: input.deliveryState,
      vehicleYear: input.vehicleYear ?? null,
      vehicleMake: input.vehicleMake ?? null,
      vehicleModel: input.vehicleModel ?? null,
      vin: input.vin ?? null,
      runningCondition: input.runningCondition ?? null,
      transportType: input.transportType ?? null,
      status: "Submitted",
      eta: null,
      userId: input.userId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    shipments.push(newShipment);
    return res.status(201).json(newShipment);
  } catch (err) {
    console.error("Shipment creation error:", err);
    return res.status(500).json({ message: "Server error creating shipment" });
  }
});

/**
 * PUBLIC: Track shipment by reference + email
 * GET /api/track
 */
router.get("/track", async (req, res) => {
  const { referenceId, email } = req.query;

  if (!referenceId || !email) {
    return res
      .status(400)
      .json({ message: "referenceId and email are required" });
  }

  const shipment = shipments.find(
    (s) =>
      s.referenceId === referenceId &&
      s.customerEmail?.toLowerCase() === String(email).toLowerCase()
  );

  if (!shipment) {
    return res.status(404).json({ message: "Shipment not found" });
  }

  return res.json(shipment);
});

/* =========================================================
   CLIENT ROUTES (AUTH REQUIRED)
   ========================================================= */

/**
 * CLIENT: Get shipments for logged-in client
 * GET /api/my-shipments
 */
router.get(
  "/my-shipments",
  requireAuth,
  requireRole("client"),
  async (req, res) => {
    const email = req.user.email;

    const myShipments = shipments.filter(
      (s) =>
        s.customerEmail &&
        s.customerEmail.toLowerCase() === email.toLowerCase()
    );

    return res.json(myShipments);
  }
);

/* =========================================================
   ADMIN / EMPLOYEE ROUTES
   ========================================================= */

/**
 * ADMIN / EMPLOYEE: List all shipments
 * GET /api/shipments
 */
router.get(
  "/shipments",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    return res.json(shipments);
  }
);

/**
 * ADMIN / EMPLOYEE: Update shipment status
 * PATCH /api/shipments/:id/status
 */
router.patch(
  "/shipments/:id/status",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const idx = shipments.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    shipments[idx] = {
      ...shipments[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    return res.json(shipments[idx]);
  }
);

export default router;
