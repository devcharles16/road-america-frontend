import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import supabase from "./supabaseClient.js";
import { requireAuth, requireRole, requireOneOf } from "./middleware/auth.js";

import { sendStatusUpdate } from "./notifications/transportStatus.js";
import { sendNewQuoteAlert, sendQuoteConfirmationEmail } from "./notifications/adminAlerts.js";

import shipmentsRouter from "./routes/shipmentsRouter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// If behind Render / proxies
app.set("trust proxy", 1);

/** =========================================================
 * CORS (FIXED)
 * - You are using Authorization: Bearer <token>
 * - You are NOT using cookies, so credentials should be false
 * ========================================================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "https://roadamericatransport.com",
  "https://www.roadamericatransport.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, server-to-server)
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    // Block unknown origins cleanly (so behavior is predictable)
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  optionsSuccessStatus: 204,
  credentials: false, // ✅ IMPORTANT for Bearer-token auth
  maxAge: 86400,
};

// CORS must be BEFORE routes
app.use(cors(corsOptions));
// Handle all preflight requests
app.options(/.*/, cors(corsOptions));

// Parse JSON
app.use(express.json());

// (Optional) Debug request origins while testing
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log("[REQ]", req.method, req.path, "origin=", req.headers.origin);
  }
  next();
});

// Health check
app.get("/api/health", (_req, res) => {
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

    return res.json({ success: true });
  } catch (err) {
    console.error("Status notification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * POST /api/notifications/new-quote
 */
app.post("/api/notifications/new-quote", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      pickup,
      dropoff,
      vehicle: vehicleRaw,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      runningCondition,
      vehicleHeightMod,
      transportType,
      preferredPickupWindow,
      referenceId,
    } = req.body || {};

    const vehicleText =
      (vehicleRaw && String(vehicleRaw).trim()) ||
      [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ").trim() ||
      "-";

    const adminResult = await sendNewQuoteAlert({
      firstName,
      lastName,
      email,
      phone,
      pickup,
      dropoff,
      vehicle: vehicleText,
      runningCondition,
      vehicleHeightMod,
      transportType,
      preferredPickupWindow,
      referenceId,
    });

    const customerResult = await sendQuoteConfirmationEmail({
      firstName,
      lastName,
      email,
      pickup,
      dropoff,
      vehicle: vehicleText,
      runningCondition,
      vehicleHeightMod,
      transportType,
      preferredPickupWindow,
      referenceId,
    });

    if (adminResult?.success === false) {
      console.error("Admin alert failed:", adminResult.error || adminResult.err);
    }
    if (customerResult?.success === false) {
      console.error("Customer confirmation failed:", customerResult.error || customerResult.err);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("new-quote notification error:", err);
    return res.status(500).json({ error: "Failed to send quote notifications." });
  }
});

// ---------- PUBLIC BLOG ROUTES ----------
function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapPostRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    status: row.status,
    imageUrl: row.image_url || null,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.get("/api/blog", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blog posts:", error);
      return res.status(500).json({ error: "Failed to fetch blog posts." });
    }

    return res.json((data || []).map(mapPostRow));
  } catch (err) {
    console.error("Unexpected error in GET /api/blog:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});

app.get("/api/blog/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("Error fetching blog post:", error);
      return res.status(500).json({ error: "Failed to fetch blog post." });
    }

    if (!data) return res.status(404).json({ error: "Post not found." });

    return res.json(mapPostRow(data));
  } catch (err) {
    console.error("Unexpected error in GET /api/blog/:slug:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});

// ---------- ADMIN BLOG ROUTES ----------
app.get("/api/admin/blog", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin blog posts:", error);
      return res.status(500).json({ error: "Failed to fetch blog posts." });
    }

    return res.json((data || []).map(mapPostRow));
  } catch (err) {
    console.error("Unexpected error in GET /api/admin/blog:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});

app.post("/api/admin/blog", requireAuth, requireRole("admin"), async (req, res) => {
  const { title, slug, excerpt, content, status, imageUrl } = req.body || {};
  if (!title) return res.status(400).json({ error: "Title is required." });

  const finalSlug = slugify(slug || title);
  const safeStatus = status === "published" ? "published" : "draft";
  const publishedAt = safeStatus === "published" ? new Date().toISOString() : null;

  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug: finalSlug,
        excerpt: excerpt || null,
        content: content || "",
        status: safeStatus,
        published_at: publishedAt,
        image_url: imageUrl || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating blog post:", error);
      return res.status(500).json({ error: "Failed to create blog post." });
    }

    return res.status(201).json(mapPostRow(data));
  } catch (err) {
    console.error("Unexpected error in POST /api/admin/blog:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});

app.patch("/api/admin/blog/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { title, slug, excerpt, content, status, imageUrl } = req.body || {};

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (slug !== undefined) updates.slug = slugify(slug || title || "");
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (content !== undefined) updates.content = content;
  if (status !== undefined) {
    const safeStatus = status === "published" ? "published" : "draft";
    updates.status = safeStatus;
    updates.published_at = safeStatus === "published" ? new Date().toISOString() : null;
  }
  if (imageUrl !== undefined) updates.image_url = imageUrl || null;

  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating blog post:", error);
      return res.status(500).json({ error: "Failed to update blog post." });
    }
    if (!data) return res.status(404).json({ error: "Post not found." });

    return res.json(mapPostRow(data));
  } catch (err) {
    console.error("Unexpected error in PATCH /api/admin/blog/:id:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});

app.delete("/api/admin/blog/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      console.error("Error deleting blog post:", error);
      return res.status(500).json({ error: "Failed to delete blog post." });
    }
    return res.status(204).send();
  } catch (err) {
    console.error("Unexpected error in DELETE /api/admin/blog/:id:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});

// ---------- ADMIN USER MANAGEMENT ROUTES ----------
app.get("/api/admin/users", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, full_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin users:", error);
      return res.status(500).json({ error: "Failed to fetch users." });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Unexpected error in GET /api/admin/users:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});

app.post("/api/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
  const { email, password, role, fullName } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({ error: "email, password, and role are required." });
  }

  const allowedRoles = ["admin", "employee", "client"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be admin, employee, or client." });
  }

  try {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || null },
    });

    if (createError) {
      console.error("Error creating Supabase auth user:", createError);
      return res.status(500).json({ error: "Failed to create auth user." });
    }

    const user = created?.user;
    if (!user) return res.status(500).json({ error: "Auth user not returned from Supabase." });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({ id: user.id, email, role, full_name: fullName || null })
      .select("id, email, role, full_name, created_at")
      .single();

    if (profileError) {
      console.error("Error inserting profile row:", profileError);
      return res.status(500).json({ error: "User created, but failed to save profile." });
    }

    return res.status(201).json(profile);
  } catch (err) {
    console.error("Unexpected error in POST /api/admin/users:", err);
    return res.status(500).json({ error: "Unexpected error." });
  }
});

// ✅ Mount your API routes (includes /api/my-shipments)
app.use("/api", shipmentsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
