import express from "express";

const router = express.Router();

/**
 * TEMP in-memory storage.
 * This resets whenever the server restarts.
 * Later we’ll move this to Supabase to persist data.
 */
let shipments = [];

// Helper to generate a simple ID
function generateId() {
  return Math.random().toString(36).slice(2);
}

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
 * ADMIN/EMPLOYEE: List all shipments
 * GET /api/shipments
 */
router.get("/shipments", async (req, res) => {
  try {
    return res.json(shipments);
  } catch (err) {
    console.error("Error listing shipments:", err);
    return res.status(500).json({ message: "Server error listing shipments" });
  }
});

/**
 * ADMIN/EMPLOYEE: Update a shipment's status
 * PATCH /api/shipments/:id/status
 */
router.patch("/shipments/:id/status", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Error updating shipment status:", err);
    return res
      .status(500)
      .json({ message: "Server error updating shipment status" });
  }
});

/**
 * CLIENT: List shipments for the currently logged-in client
 * GET /api/my-shipments
 *
 * For now we just filter by ?email=... so you can test.
 * Later we’ll hook into Supabase auth for real user-specific data.
 */
router.get("/my-shipments", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res
        .status(400)
        .json({ message: "email query param required for now" });
    }

    const myShipments = shipments.filter(
      (s) =>
        s.customerEmail &&
        s.customerEmail.toLowerCase() === String(email).toLowerCase()
    );

    return res.json(myShipments);
  } catch (err) {
    console.error("Error listing my shipments:", err);
    return res
      .status(500)
      .json({ message: "Server error listing client shipments" });
  }
});

/**
 * PUBLIC: Track a specific shipment by reference ID + email
 * GET /api/track?referenceId=...&email=...
 */
router.get("/track", async (req, res) => {
  try {
    const { referenceId, email } = req.query;

    if (!referenceId || !email) {
      return res
        .status(400)
        .json({ message: "referenceId and email are required" });
    }

    const shipment = shipments.find(
      (s) =>
        s.referenceId === referenceId &&
        s.customerEmail &&
        s.customerEmail.toLowerCase() === String(email).toLowerCase()
    );

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    return res.json(shipment);
  } catch (err) {
    console.error("Error tracking shipment:", err);
    return res.status(500).json({ message: "Server error tracking shipment" });
  }
});

export default router;
