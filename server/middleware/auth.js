import supabase from "../supabaseClient.js";

async function getUserAndRole(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";

  // Safer debug logging (do NOT print the raw token)
  console.log("[AUTH] Request headers:", {
    hasAuthorization: !!req.headers.authorization,
    hasAuthorizationCaps: !!req.headers.Authorization,
    allHeaders: Object.keys(req.headers),
  });

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.log("[AUTH] No token found in request");
    return { user: null, role: null };
  }

  console.log("[AUTH] Token found, length:", token.length);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    console.log("[AUTH] supabase.auth.getUser failed:", error?.message || error);
    return { user: null, role: null };
  }

  const user = data.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    // User exists, but role lookup failed — allow user through with null role
    console.log("[AUTH] profile role lookup failed:", profileError.message);
    return { user, role: null };
  }

  const role = profile?.role ? String(profile.role).trim().toLowerCase() : null;
  return { user, role };
}

export async function requireAuth(req, res, next) {
  console.log("[AUTH] requireAuth middleware called for:", req.method, req.path);

  try {
    const { user, role } = await getUserAndRole(req);

    if (!user) {
      console.log("[AUTH] No user found, returning 401");
      return res.status(401).json({ error: "Missing auth token" });
    }

    console.log("[AUTH] User authenticated:", user.id, "Role:", role);
    req.user = user;
    req.userRole = role;

    return next(); // ✅ MUST return next()
  } catch (err) {
    console.error("[AUTH] Auth check failed:", err);
    return res.status(500).json({ error: "Auth check failed" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Missing auth token" });
    }
    if (req.userRole !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

export function requireOneOf(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Missing auth token" });
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

/**
 * ✅ REAL middleware (NOT a factory)
 * Allow clients or users with null role (default clients).
 * Deny admin and employee roles.
 * For endpoints accessible to regular customers.
 */
export function requireClient(req, res, next) {
  console.log("[AUTH] requireClient called for:", req.method, req.path);

  if (!req.user) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  // Deny admin and employee explicitly
  if (req.userRole === "admin" || req.userRole === "employee") {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Allow client role or null (default clients who haven't had role set)
  return next(); // ✅ MUST return next()
}
