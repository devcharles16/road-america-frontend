import express from "express";
import { requireAuth, requireRole, requireOneOf, requireClient } from "../middleware/auth.js";
import supabase from "../supabaseClient.js";
import {
  sendNewBusinessInquiryAlert,
  sendBusinessInquiryConfirmationEmail,
} from "../notifications/adminAlerts.js";
import { resolveMaterialChangeReview } from "../utils/bookingDetails.js";
import { notifyShipmentStatusChange } from "../notifications/shipmentStatusNotifications.js";


const router = express.Router();

// Escapes ilike's wildcard metacharacters (%, _) in a value before it's
// used as the comparison target, not the pattern — case-insensitive
// EXACT matching, with none of ilike's wildcard-interpretation risk. Used
// instead of assuming existing customer_email values are already stored
// lowercase/normalized (unverified), which a plain .eq() would require.
// Must escape the backslash itself first, or a value already containing
// one would be double-escaped incorrectly.
export function escapeIlikeWildcards(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export const ALLOWED_STATUSES = [
  "Request Submitted",
  "Quoted",
  "Pending Booking",
  "Preparing for Carrier Assignment",
  "Carrier Assigned",
  "In Transit",
  "Delivered",
  "Canceled",
  "Expired",
  "Submitted",
  "Driver Assigned",
  "Cancelled",
];

/**
 * Verifies a reCAPTCHA v3 token against Google's siteverify endpoint.
 * Returns { ok: true } or { ok: false, status, message } for the caller to relay.
 */
async function verifyRecaptcha(captchaToken, expectedAction) {
  if (!captchaToken) {
    return { ok: false, status: 400, message: "Captcha required" };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("Missing RECAPTCHA_SECRET_KEY");
    return { ok: false, status: 500, message: "Captcha not configured" };
  }

  const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: captchaToken }),
  });

  const captcha = await verifyRes.json();
  const score = typeof captcha.score === "number" ? captcha.score : 0;
  const action = typeof captcha.action === "string" ? captcha.action : "";

  if (!captcha.success || action !== expectedAction || score < 0.5) {
    return {
      ok: false,
      status: 403,
      message: "Captcha failed",
      details: { success: captcha.success, score, action, errors: captcha["error-codes"] },
    };
  }

  return { ok: true };
}


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

/* =========================================================
   BUSINESS (B2B) INQUIRIES (PUBLIC + ADMIN)
   ========================================================= */

/**
 * PUBLIC: Create a business/commercial transport inquiry
 * POST /api/business-inquiries
 */
router.post("/business-inquiries", async (req, res) => {
  try {
    const input = req.body || {};

    const captchaCheck = await verifyRecaptcha(input.captchaToken, "submit_business_inquiry");
    if (!captchaCheck.ok) {
      return res.status(captchaCheck.status).json({
        message: captchaCheck.message,
        details: captchaCheck.details,
      });
    }

    if (!input.firstName || !input.lastName || !input.businessName || !input.email || !input.phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payload = {
      first_name: input.firstName,
      last_name: input.lastName,
      business_name: input.businessName,
      job_title: input.jobTitle || null,
      email: input.email,
      phone: input.phone,

      business_type: input.businessType || null,
      transport_need: input.transportNeed || null,
      estimated_volume: input.estimatedVolume || null,

      pickup_city_state: input.pickupCityState || null,
      delivery_city_state: input.deliveryCityState || null,
      additional_details: input.additionalDetails || null,

      utm_source: input.utmSource || null,
      utm_medium: input.utmMedium || null,
      utm_campaign: input.utmCampaign || null,
      qr_campaign: input.qrCampaign || null,

      status: "New",
    };

    const { data, error } = await supabase
      .from("business_inquiries")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    const alertResult = await sendNewBusinessInquiryAlert({
      firstName: input.firstName,
      lastName: input.lastName,
      businessName: input.businessName,
      jobTitle: input.jobTitle,
      email: input.email,
      phone: input.phone,
      businessType: input.businessType,
      transportNeed: input.transportNeed,
      estimatedVolume: input.estimatedVolume,
      pickupCityState: input.pickupCityState,
      deliveryCityState: input.deliveryCityState,
      additionalDetails: input.additionalDetails,
    });

    if (alertResult?.success === false) {
      console.error("Business inquiry admin alert failed:", alertResult.error || alertResult.err);
    }

    const confirmationResult = await sendBusinessInquiryConfirmationEmail({
      firstName: input.firstName,
      businessName: input.businessName,
      email: input.email,
      businessType: input.businessType,
      transportNeed: input.transportNeed,
      estimatedVolume: input.estimatedVolume,
      pickupCityState: input.pickupCityState,
      deliveryCityState: input.deliveryCityState,
    });

    if (confirmationResult?.success === false) {
      console.error(
        "Business inquiry customer confirmation failed:",
        confirmationResult.error || confirmationResult.err
      );
    }

    return res.status(201).json({ id: data.id });
  } catch (err) {
    console.error("Business inquiry creation error:", err);
    return res.status(500).json({ message: "Server error creating business inquiry" });
  }
});

/**
 * ADMIN/EMPLOYEE: List business inquiries
 * GET /api/business-inquiries
 */
router.get(
  "/business-inquiries",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from("business_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json(data ?? []);
    } catch (err) {
      console.error("List business inquiries error:", err);
      return res.status(500).json({ message: "Server error listing business inquiries" });
    }
  }
);

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

    if (data) {
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
    }

    // Not booked yet — no shipment exists under this reference. Fall back
    // to the quote itself, which carries the same reference_id (unique on
    // both tables) from creation through booking. This never calls
    // convert_quote_to_shipment — that remains a deliberate, staff-
    // triggered action, completely decoupled from read-only tracking.
    // Same response shape as the shipment branch above; fields with no
    // quote-side equivalent (eta, userId — shipment-only concepts) are
    // simply null, and `status` is returned exactly as stored (including
    // null), same as the shipment branch — the frontend's existing
    // normalizeStatus() already treats a null/unrecognized status as
    // "Request Submitted", so no new default is introduced here.
    // Case-insensitive EXACT match on the value, not a pattern — the
    // value's own wildcard metacharacters (%, _) are escaped first, so
    // an email containing either can never match more broadly than
    // intended. Doesn't assume existing customer_email rows are already
    // stored lowercase (unverified), which a plain .eq() would require;
    // this works correctly regardless. The existing shipments-side
    // lookup above is left exactly as it was — unchanged, out of this
    // task's scope — this fix applies only to the new quote fallback.
    const normalizedEmail = escapeIlikeWildcards(String(email).trim().toLowerCase());
    const { data: quote, error: quoteErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("reference_id", referenceId)
      .ilike("customer_email", normalizedEmail)
      .maybeSingle();

    if (quoteErr) throw quoteErr;
    if (!quote) return res.status(404).json({ message: "Shipment not found" });

    return res.json({
      id: quote.id,
      referenceId: quote.reference_id,

      customerName: quote.customer_name,
      customerEmail: quote.customer_email,
      customerPhone: quote.customer_phone,

      pickupCity: quote.pickup_city,
      pickupState: quote.pickup_state,
      deliveryCity: quote.delivery_city,
      deliveryState: quote.delivery_state,

      vehicleYear: quote.vehicle_year,
      vehicleMake: quote.vehicle_make,
      vehicleModel: quote.vehicle_model,
      vin: quote.vin,

      runningCondition: quote.running_condition,
      transportType: quote.transport_type,

      status: quote.website_tracking_status,
      eta: null,

      userId: null,

      createdAt: quote.created_at,
      updatedAt: quote.updated_at,
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
function mapShipmentRow(data) {
  return {
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
  };
}

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

      // update_shipment_status (SQL function) does the write and the
      // change-detection atomically, using IS DISTINCT FROM — not
      // PostgREST's .neq() filter, which compiles to a plain SQL <>
      // and would never match when the stored status is NULL, wrongly
      // treating that as "no change" forever.
      const { data: rpcData, error: rpcErr } = await supabase.rpc("update_shipment_status", {
        p_id: id,
        p_status: status,
      });
      if (rpcErr) throw rpcErr;

      const outcome = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (!outcome || !outcome.applied) {
        return res.status(404).json({ message: "Shipment not found." });
      }

      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      if (outcome.status_changed) {
        // A real change — notify. Never blocks or retries the
        // already-successful write over a notification failure
        // (notifyShipmentStatusChange never throws).
        await notifyShipmentStatusChange({
          referenceId: data.reference_id,
          status: data.status,
          customerEmail: data.customer_email,
          customerName: data.customer_name,
        });
      }

      return res.json(mapShipmentRow(data));
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

/**
 * ADMIN/EMPLOYEE: Clear a booking package selection so the customer can
 * pick again. "First confirmed selection wins" means once a package is
 * recorded there is no customer-facing way to change it — this is the
 * authorized override for staff.
 * DELETE /api/admin/booking-selections/:referenceId
 */
router.delete(
  "/admin/booking-selections/:referenceId",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    try {
      const referenceId = String(req.params.referenceId || "").trim().toUpperCase();
      if (!/^RA-\d{5,12}$/i.test(referenceId)) {
        return res.status(400).json({ message: "Invalid reference id." });
      }

      const { data, error } = await supabase
        .from("booking_selections")
        .delete()
        .eq("reference_id", referenceId)
        .select("reference_id, package")
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ message: "No booking selection found for that reference." });

      return res.json({ ok: true, cleared: data });
    } catch (err) {
      console.error("Reset booking selection error:", err);
      return res.status(500).json({ message: "Server error resetting booking selection" });
    }
  }
);

/**
 * ADMIN ONLY: Resolve a material-change review flag on a guided booking's
 * details. Calls resolve_material_change_review(), which locks the row,
 * verifies expectedRevision still matches the row's current revision (the
 * admin must be approving the exact state they reviewed, not whatever the
 * row happens to be now — a stale approval is rejected, not silently
 * applied), then atomically approves every material field currently on
 * the row and writes a booking_audit_log entry in the same transaction.
 * This does NOT clear pending_customer_confirmation — that requires the
 * customer's own confirm_booking_revision() call. Employees only get read
 * access per the access-level requirements; discrepancy resolution is an
 * admin action.
 * POST /api/admin/booking-details/:referenceId/resolve-review
 * Body: { expectedRevision: number }
 */
router.post(
  "/admin/booking-details/:referenceId/resolve-review",
  requireAuth,
  requireOneOf(["admin"]),
  async (req, res) => {
    try {
      const referenceId = String(req.params.referenceId || "").trim().toUpperCase();
      if (!/^RA-\d{5,12}$/i.test(referenceId)) {
        return res.status(400).json({ message: "Invalid reference id." });
      }

      const expectedRevision = Number(req.body?.expectedRevision);
      if (!Number.isInteger(expectedRevision) || expectedRevision < 1) {
        return res.status(400).json({ message: "A valid expectedRevision is required." });
      }

      const outcome = await resolveMaterialChangeReview(referenceId, req.user?.id || null, expectedRevision);
      if (!outcome.resolved) {
        if (outcome.reason === "stale_revision") {
          return res.status(409).json({
            message: "This booking has changed since you reviewed it. Please reload and review the latest details before approving.",
            currentRevision: outcome.currentRevision,
          });
        }
        if (outcome.reason === "not_found") {
          return res.status(404).json({ message: "No booking details found for that reference." });
        }
        return res.status(409).json({ message: "This booking is not currently awaiting review." });
      }

      return res.json({ ok: true, status: outcome.status });
    } catch (err) {
      console.error("Resolve booking-details review error:", err);
      return res.status(500).json({ message: "Server error resolving review." });
    }
  }
);

/**
 * ADMIN/EMPLOYEE: Full booking view by reference, for the admin dashboard's
 * Booking Details section — quote, selected package, and booking details
 * in one response, so the dashboard doesn't need direct Supabase access.
 * Audit history is admin-only, per the access-level requirements (employees
 * get everything needed for operational duties, not audit visibility).
 * GET /api/admin/bookings/:referenceId
 */
router.get(
  "/admin/bookings/:referenceId",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    try {
      const referenceId = String(req.params.referenceId || "").trim().toUpperCase();
      if (!/^RA-\d{5,12}$/i.test(referenceId)) {
        return res.status(400).json({ message: "Invalid reference id." });
      }

      const { data: quote, error: quoteErr } = await supabase
        .from("quotes")
        .select("*")
        .eq("reference_id", referenceId)
        .maybeSingle();
      if (quoteErr) throw quoteErr;
      if (!quote) return res.status(404).json({ message: "No quote found for that reference." });

      const { data: selection, error: selectionErr } = await supabase
        .from("booking_selections")
        .select("package, created_at")
        .eq("reference_id", referenceId)
        .maybeSingle();
      if (selectionErr) throw selectionErr;

      const { data: details, error: detailsErr } = await supabase
        .from("booking_details")
        .select("*")
        .eq("reference_id", referenceId)
        .maybeSingle();
      if (detailsErr) throw detailsErr;

      let auditLog = null;
      if (req.userRole === "admin") {
        const { data: log, error: logErr } = await supabase
          .from("booking_audit_log")
          .select("action, performed_by, performed_at, details")
          .eq("reference_id", referenceId)
          .order("performed_at", { ascending: false });
        if (logErr) throw logErr;
        auditLog = log;
      }

      return res.json({ quote, selection: selection || null, details: details || null, auditLog });
    } catch (err) {
      console.error("Admin booking lookup error:", err);
      return res.status(500).json({ message: "Server error retrieving booking." });
    }
  }
);

export default router;