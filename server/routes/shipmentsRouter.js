import express from "express";
import { requireAuth,requireRole, requireOneOf } from "../middleware/auth.js";
import supabase from "../supabaseClient.js";


const router = express.Router();

const ALLOWED_STATUSES = [
  "Submitted",
  "Driver Assigned",
  "In Transit",
  "Delivered",
  "Cancelled",
];


/* =========================================================
   QUOTES (PUBLIC + ADMIN)
   ========================================================= */

/**
 * PUBLIC: Create a quote (intake)
 * POST /api/quotes
 */
router.post("/quotes", async (req, res) => {
  try {
    const input = req.body;

    const payload = {
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      customer_name: input.customerName ?? null, // optional if you still want it
      customer_email: input.customerEmail ?? null,
      customer_phone: input.customerPhone ?? null,

      pickup_city: input.pickupCity ?? null,
      pickup_state: input.pickupState ?? null,
      delivery_city: input.deliveryCity ?? null,
      delivery_state: input.deliveryState ?? null,

      vehicle_year: input.vehicleYear ?? null,
      vehicle_make: input.vehicleMake ?? null,
      vehicle_model: input.vehicleModel ?? null,
      vin: input.vin ?? null,

      running_condition: input.runningCondition ?? null,
      transport_type: input.transportType ?? null,

      pickup_window: input.preferredPickupWindow ?? null,
      vehicle_height_mod: input.vehicleHeightMod ?? null,

      notes: input.notes ?? null,
      quote_status: "New",
    };

    const { data, error } = await supabase
      .from("quotes")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    // Return camelCase-ish for frontend convenience
    return res.status(201).json({
      id: data.id,
      referenceId: data.reference_id,
      ...data,
    });
  } catch (err) {
    console.error("Quote creation error:", err);
    return res.status(500).json({ message: "Server error creating quote" });
  }
});

/**
 * ADMIN/EMPLOYEE: Convert a quote into a shipment
 * POST /api/shipments/from-quote
 * Body: { quoteId, userId? }
 */
router.post(
  "/shipments/from-quote",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    try {
      const { quoteId } = req.body || {};
      if (!quoteId) {
        return res.status(400).json({ message: "quoteId is required" });
      }

      // 1) Convert via DB function (atomic)
      const { data: shipmentId, error: rpcErr } = await supabase.rpc(
        "convert_quote_to_shipment",
        { p_quote_id: quoteId }
      );

      if (rpcErr) throw rpcErr;
      if (!shipmentId) {
        return res.status(500).json({ message: "Conversion did not return a shipment id" });
      }

      // 2) Fetch shipment
      const { data: shipment, error: fetchErr } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", shipmentId)
        .single();

      if (fetchErr) throw fetchErr;

      // 3) Respond in the same style your frontend expects
      return res.status(201).json({
        id: shipment.id,
        referenceId: shipment.reference_id,
        ...shipment,
      });
    } catch (err) {
      console.error("Convert quote → shipment error:", err);
      return res.status(500).json({ message: "Server error converting quote to shipment" });
    }
  }
);

/**
 * PUBLIC: Track shipment by reference + email
 * GET /api/track?referenceId=RA-100000&email=test@example.com
 */
router.get("/track", async (req, res) => {
  try {
    const { referenceId, email } = req.query;
    if (!referenceId || !email) {
      return res.status(400).json({ message: "referenceId and email are required" });
    }

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("reference_id", referenceId)
      .ilike("customer_email", String(email))
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Shipment not found" });

    return res.json({
  id: data.id,
  referenceId: data.reference_id,

  customerName: data.customer_name,
  customerEmail: data.customer_email,
  customerPhone: data.customer_phone,

  pickupCity: data.pickup_city,
  pickupState: data.pickup_state,
  deliveryCity: data.delivery_city,
  deliveryState: data.delivery_state,

  vehicleYear: data.vehicle_year,
  vehicleMake: data.vehicle_make,
  vehicleModel: data.vehicle_model,
  vin: data.vin,

  runningCondition: data.running_condition,
  transportType: data.transport_type,

  status: data.status,
  eta: data.eta,

  userId: data.user_id,

  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

  } catch (err) {
    console.error("Track shipment error:", err);
    return res.status(500).json({ message: "Server error tracking shipment" });
  }
});

/**
 * CLIENT: Get shipments for logged-in client
 * GET /api/my-shipments
 */
router.get(
  "/my-shipments",
  requireAuth,
  requireRole("client"),
  async (req, res) => {
    try {
      const email = req.user.email;

      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .ilike("customer_email", email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json(
        (data ?? []).map((s) => ({ ...s, referenceId: s.reference_id }))
      );
    } catch (err) {
      console.error("My shipments error:", err);
      return res.status(500).json({ message: "Server error loading shipments" });
    }
  }
);

/**
 * ADMIN/EMPLOYEE: List all shipments
 * GET /api/shipments
 */
router.get(
  "/shipments",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json(
        (data ?? []).map((s) => ({ ...s, referenceId: s.reference_id }))
      );
    } catch (err) {
      console.error("List shipments error:", err);
      return res.status(500).json({ message: "Server error listing shipments" });
    }
  }
);

/**
 * ADMIN/EMPLOYEE: Update shipment status
 * PATCH /api/shipments/:id/status
 */
router.patch(
  "/shipments/:id/status",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`,
        });
      }

      const { data, error } = await supabase
        .from("shipments")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return res.json({ ...data, referenceId: data.reference_id });
    } catch (err) {
      console.error("Update status error:", err);
      return res.status(500).json({ message: "Server error updating status" });
    }
  }
);
/**
 * ADMIN/EMPLOYEE: List all quotes
 * GET /api/quotes
 */
router.get(
  "/quotes",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json(
        (data ?? []).map((q) => ({
          ...q,
          referenceId: q.reference_id,
        }))
      );
    } catch (err) {
      console.error("List quotes error:", err);
      return res.status(500).json({ message: "Server error listing quotes" });
    }
  }
);


export default router;