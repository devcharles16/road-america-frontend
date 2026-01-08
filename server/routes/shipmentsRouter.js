import express from "express";
import { requireAuth, requireRole, requireOneOf, requireClient } from "../middleware/auth.js";
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
    // 0) Verify reCAPTCHA token (v3)
    const captchaToken = input.captchaToken;
    if (!captchaToken) {
      return res.status(400).json({ message: "Captcha required" });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      console.error("Missing RECAPTCHA_SECRET_KEY");
      return res.status(500).json({ message: "Captcha not configured" });
    }

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: captchaToken,
        // remoteip: req.ip, // optional; can cause issues behind proxies if not configured
      }),
    });

    const captcha = await verifyRes.json();

    // Typical v3 response has: success, score, action, challenge_ts, hostname, error-codes
    const score = typeof captcha.score === "number" ? captcha.score : 0;
    const action = typeof captcha.action === "string" ? captcha.action : "";

    // Match the action you used in the frontend: "submit_quote"
    if (!captcha.success || action !== "submit_quote" || score < 0.5) {
      return res.status(403).json({
        message: "Captcha failed",
        // Optional for debugging; you can remove in production:
        details: { success: captcha.success, score, action, errors: captcha["error-codes"] },
      });
    }
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
      let shipmentRow = shipment;
      // Attach shipment to user automatically if possible
      if (!shipmentRow.user_id && shipmentRow.customer_email) {
        const email = shipmentRow.customer_email.trim().toLowerCase();

        const { data: userMatch } = await supabase
          .from("auth.users")
          .select("id")
          .ilike("email", email)
          .maybeSingle();

        if (userMatch?.id) {
          const { data: updated } = await supabase
            .from("shipments")
            .update({
              user_id: userMatch.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", shipmentId)
            .select("*")
            .single();

          if (updated) {
            shipmentRow = updated;
          }
        }
      }

      // If userId is provided, attach it to the shipment (best effort)
      if (userId) {
        const { data: updated, error: updErr } = await supabase
          .from("shipments")
          .update({ user_id: userId, updated_at: new Date().toISOString() })
          .eq("id", shipmentId)
          .select("*")
          .single();

        if (!updErr && updated) {
          shipmentRow = updated;
        }
      }

      // 3) Respond in the same style your frontend expects
      return res.status(201).json({
        id: shipmentRow.id,
        referenceId: shipmentRow.reference_id,
        ...shipmentRow,
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
  requireClient,
  async (req, res) => {
    const rid = Math.random().toString(16).slice(2, 8);
    console.log(`[my-shipments ${rid}] START`);

    try {
      const userId = req.user?.id;
      const email = String(req.user?.email ?? "").trim().toLowerCase();

      console.log(`[my-shipments ${rid}] identity`, { userId, email });

      const orParts = [];
      if (userId) orParts.push(`user_id.eq.${userId}`);
      if (email) orParts.push(`customer_email.ilike.${email}`);

      if (orParts.length === 0) {
        console.log(`[my-shipments ${rid}] missing identity -> 401`);
        return res.status(401).json({ message: "Missing user identity" });
      }

      console.log(`[my-shipments ${rid}] querying supabase...`, orParts);

      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .or(orParts.join(","))
        .order("created_at", { ascending: false });

      console.log(`[my-shipments ${rid}] supabase returned`, {
        error: !!error,
        rows: (data ?? []).length,
      });

      if (error) throw error;

      // ...your existing mapping...
      return res.json(
        (data ?? []).map((s) => ({
          id: s.id,
          referenceId: s.reference_id,
          customerName: s.customer_name,
          customerEmail: s.customer_email,
          customerPhone: s.customer_phone,
          pickupCity: s.pickup_city,
          pickupState: s.pickup_state,
          deliveryCity: s.delivery_city,
          deliveryState: s.delivery_state,
          vehicleYear: s.vehicle_year,
          vehicleMake: s.vehicle_make,
          vehicleModel: s.vehicle_model,
          vin: s.vin,
          runningCondition: s.running_condition,
          transportType: s.transport_type,
          status: s.status,
          eta: s.eta,
          userId: s.user_id,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }))
      );
    } catch (err) {
      console.error(`[my-shipments] ERROR`, err);
      return res.status(500).json({ message: "Server error loading shipments" });
    } finally {
      console.log(`[my-shipments ${rid}] END`);
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
        (data ?? []).map((s) => ({
          id: s.id,
          referenceId: s.reference_id,

          customerName: s.customer_name,
          customerEmail: s.customer_email,
          customerPhone: s.customer_phone,

          pickupCity: s.pickup_city,
          pickupState: s.pickup_state,
          deliveryCity: s.delivery_city,
          deliveryState: s.delivery_state,

          vehicleYear: s.vehicle_year,
          vehicleMake: s.vehicle_make,
          vehicleModel: s.vehicle_model,
          vin: s.vin,

          runningCondition: s.running_condition,
          transportType: s.transport_type,
          pickupWindow: s.pickup_window,
          vehicleHeightMod: s.vehicle_height_mod,

          notes: s.notes,
          status: s.status,
          eta: s.eta,

          userId: s.user_id,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }))
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
        pickupWindow: data.pickup_window,
        vehicleHeightMod: data.vehicle_height_mod,

        notes: data.notes,
        status: data.status,
        eta: data.eta,

        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
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