// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { supabase } = require("./supabaseClient");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ---------- Helpers ----------

// Generates reference IDs like RAU-1738523920
function generateReferenceId() {
  const base = Math.floor(Date.now() / 1000);
  return `RAU-${base}`;
}

// Map a Supabase row (snake_case) to API response (camelCase)
function mapShipmentRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    referenceId: row.reference_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    pickupCity: row.pickup_city,
    pickupState: row.pickup_state,
    deliveryCity: row.delivery_city,
    deliveryState: row.delivery_state,
    vehicleYear: row.vehicle_year,
    vehicleMake: row.vehicle_make,
    vehicleModel: row.vehicle_model,
    vin: row.vin,
    runningCondition: row.running_condition,
    transportType: row.transport_type,
    status: row.status,
    eta: row.eta,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getUserRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Profiles lookup error:", error);
    return null;
  }

  return data?.role ?? null;
}

// ---------- Auth middlewares ----------

// 1) Require a valid Supabase JWT (from frontend)
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.header("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error("Auth error:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = data.user; // { id, email, ... }
    next();
  } catch (err) {
    console.error("requireAuth unexpected error:", err);
    return res.status(500).json({ error: "Auth error" });
  }
}

// 2) Require EXACT role (admin / employee / client)
function requireRole(requiredRole) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(500)
          .json({ error: "Auth middleware order incorrect" });
      }

      const role = await getUserRole(req.user.id);
      if (!role) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (role !== requiredRole) {
        return res.status(403).json({ error: "Forbidden" });
      }

      req.userRole = role;
      next();
    } catch (err) {
      console.error("requireRole unexpected error:", err);
      return res.status(500).json({ error: "Role check error" });
    }
  };
}

// 3) Require one of multiple roles (e.g. admin OR employee)
function requireOneOf(rolesArray) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(500)
          .json({ error: "Auth middleware order incorrect" });
      }

      const role = await getUserRole(req.user.id);
      if (!role) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!rolesArray.includes(role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      req.userRole = role;
      next();
    } catch (err) {
      console.error("requireOneOf unexpected error:", err);
      return res.status(500).json({ error: "Role check error" });
    }
  };
}

// ---------- PUBLIC ROUTES ----------

// POST /api/shipments - Create new transport request (quote form)
app.post("/api/shipments", async (req, res) => {
  const body = req.body || {};

  if (
    !body.pickupCity ||
    !body.pickupState ||
    !body.deliveryCity ||
    !body.deliveryState ||
    !body.customerName ||
    !body.customerEmail
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const now = new Date().toISOString();
  const referenceId = generateReferenceId();

  const newShipmentRow = {
    reference_id: referenceId,
    customer_name: body.customerName,
    customer_email: body.customerEmail,
    customer_phone: body.customerPhone || null,
    pickup_city: body.pickupCity,
    pickup_state: body.pickupState,
    delivery_city: body.deliveryCity,
    delivery_state: body.deliveryState,
    vehicle_year: body.vehicleYear || null,
    vehicle_make: body.vehicleMake || null,
    vehicle_model: body.vehicleModel || null,
    vin: body.vin || null,
    running_condition: body.runningCondition || null,
    transport_type: body.transportType || null,
    status: "Submitted",
    eta: null,
    user_id: body.userId || null, // optional, for logged-in clients later
    created_at: now,
    updated_at: now,
  };

  console.log("Creating shipment:", newShipmentRow);

  const { data, error } = await supabase
    .from("shipments")
    .insert(newShipmentRow)
    .select("*")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return res.status(500).json({ error: "Failed to create shipment." });
  }

  return res.status(201).json(mapShipmentRow(data));
});

// GET /api/track?referenceId=...&email=... - Public tracking
app.get("/api/track", async (req, res) => {
  const referenceId = (req.query.referenceId || "").toString().trim();
  const email = (req.query.email || "").toString().trim();

  if (!referenceId || !email) {
    return res
      .status(400)
      .json({ error: "referenceId and email are required." });
  }

  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("reference_id", referenceId)
    .eq("customer_email", email)
    .maybeSingle();

  if (error) {
    console.error("Supabase track error:", error);
    return res.status(500).json({ error: "Failed to lookup shipment." });
  }

  if (!data) {
    return res.status(404).json({ error: "Shipment not found." });
  }

  return res.json(mapShipmentRow(data));
});

// ---------- ADMIN + EMPLOYEE ROUTES ----------

// GET /api/shipments - admin + employee: view ALL shipments
app.get(
  "/api/shipments",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({ error: "Failed to load shipments." });
    }

    const mapped = data.map(mapShipmentRow);
    return res.json(mapped);
  }
);

// PATCH /api/shipments/:id/status - admin + employee: update status
app.patch(
  "/api/shipments/:id/status",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};

    const validStatuses = [
      "Submitted",
      "Driver Assigned",
      "In Transit",
      "Delivered",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const { data, error } = await supabase
      .from("shipments")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return res
        .status(500)
        .json({ error: "Failed to update shipment status." });
    }

    if (!data) {
      return res.status(404).json({ error: "Shipment not found." });
    }

    return res.json(mapShipmentRow(data));
  }
);

// ---------- CLIENT ROUTES ----------

// GET /api/my-shipments - client: view own shipments only
app.get(
  "/api/my-shipments",
  requireAuth,
  requireRole("client"),
  async (req, res) => {
    const userId = req.user.id;
    const email = req.user.email;

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .or(`user_id.eq.${userId},customer_email.eq.${email}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase my-shipments error:", error);
      return res.status(500).json({ error: "Failed to load shipments." });
    }

    const mapped = data.map(mapShipmentRow);
    return res.json(mapped);
  }
);

// ---------- USER MANAGEMENT (admin + employee) ----------

// POST /api/admin/users
// admin: can create admin/employee/client
// employee: can create client ONLY
app.post(
  "/api/admin/users",
  requireAuth,
  requireOneOf(["admin", "employee"]),
  async (req, res) => {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const requestedRole = role || "client";
    const allowedRoles = ["admin", "employee", "client"];

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({ error: "Invalid role value." });
    }

    const callerRole = req.userRole; // set by requireOneOf
    let finalRole = requestedRole;

    // Employees can only create client accounts
    if (callerRole === "employee" && requestedRole !== "client") {
      finalRole = "client";
    }

    try {
      // Create user via Supabase Auth admin API
      const { data: created, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (createError || !created?.user) {
        console.error("Supabase createUser error:", createError);
        return res
          .status(500)
          .json({ error: "Failed to create user account." });
      }

      const userId = created.user.id;

      // Insert profile with role
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          role: finalRole,
        });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        return res
          .status(500)
          .json({ error: "User created, but failed to set role." });
      }

      return res.status(201).json({
        id: userId,
        email,
        role: finalRole,
      });
    } catch (err) {
      console.error("Unexpected error creating user:", err);
      return res.status(500).json({ error: "Unexpected error." });
    }
  }
);
// ---------- PUBLIC AUTH ROUTES (CLIENT REGISTRATION) ----------

// POST /api/auth/register - Public client registration
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, phone } = req.body || {};

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required." });
  }

  try {
    // Create user with Supabase Auth (service role key on backend)
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || null,
          phone: phone || null,
        },
      });

    if (createError || !created?.user) {
      console.error("Supabase createUser error (public register):", createError);
      return res
        .status(500)
        .json({ error: "Failed to create client account." });
    }

    const userId = created.user.id;

    // Set profile role to 'client'
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: userId, role: "client" });

    if (profileError) {
      console.error("Profile insert error (public register):", profileError);
      return res
        .status(500)
        .json({ error: "Account created, but failed to set role." });
    }

    return res.status(201).json({
      id: userId,
      email,
      role: "client",
    });
  } catch (err) {
    console.error("Unexpected error in /api/auth/register:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});


// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
