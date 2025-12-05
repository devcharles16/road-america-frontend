// routes/shipmentsRouter.js
import express from "express";

const router = express.Router();

/**
 * TEMP in-memory storage.
 * This resets whenever the server restarts.
 * We'll replace this with Supabase later.
 */
let shipments = [];

// Helper to generate a simple ID
function generateId() {
  return Math.random().toString(36).slice(2);
}

/**
 * PUBLIC: Create a new transport request (quote submission)
 * This will handle: POST /api/shipments
 */
router.post("/", async (req, res) => {
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
    console.log("New shipment received:", newShipment);

    return res.status(201).json(newShipment);
  } catch (err) {
    console.error("Shipment creation error:", err);
    return res
      .status(500)
      .json({ message: "Server error creating shipment" });
  }
});

/**
 * (Optional) ADMIN: List all shipments
 * This will handle: GET /api/shipments
 */
router.get("/", async (req, res) => {
  try {
    return res.json(shipments);
  } catch (err) {
    console.error("Error listing shipments:", err);
    return res.status(500).json({ message: "Server error listing shipments" });
  }
});

export default router;
