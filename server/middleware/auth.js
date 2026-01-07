import supabase from "../supabaseClient.js";

async function getUserAndRole(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return { user: null, role: null };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return { user: null, role: null };
  }

  const user = data.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { user, role: null };
  }

  // Normalize role to lowercase for consistency
  const role = profile?.role ? String(profile.role).trim().toLowerCase() : null;
  return { user, role };
}

export function requireAuth(req, res, next) {
  getUserAndRole(req)
    .then(({ user, role }) => {
      if (!user) {
        return res.status(401).json({ error: "Missing auth token" });
      }
      req.user = user;
      req.userRole = role;
      next();
    })
    .catch(() =>
      res.status(500).json({ error: "Auth check failed" })
    );
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Missing auth token" });
    }
    if (req.userRole !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
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
    next();
  };
}

/**
 * Allow clients or users with null role (default clients).
 * Deny admin and employee roles.
 * This is for endpoints that should be accessible to regular customers.
 */
export function requireClient() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Missing auth token" });
    }
    // Deny admin and employee explicitly
    if (req.userRole === "admin" || req.userRole === "employee") {
      return res.status(403).json({ error: "Forbidden" });
    }
    // Allow client role or null (default clients who haven't had role set)
    next();
  };
}
