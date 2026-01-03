import { supabase } from "../lib/supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// ================================
// AUTH: Always read the freshest token
// ================================
// IMPORTANT: Do NOT cache tokens in module variables.
// Supabase can refresh/rotate tokens; we must read current session each call.
export async function getFreshAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}
export async function getAccessTokenOrThrow(): Promise<string> {
  const token = await getFreshAccessToken(); // or whatever your “fresh” getter is named
  if (!token) throw new Error("Not authenticated");
  return token;
}

// ================================
// HTTP: Fetch with auth + no-store
// ================================
// - Forces fresh network reads (reduces “feels cached” confusion)
// - Throws on non-OK so errors don’t masquerade as empty lists
// ================================
// HTTP: Fetch with auth + no caching
// ================================
// WHY THIS EXISTS:
// - Centralizes auth handling
// - Prevents stale token bugs
// - Forces real network requests (no-store)
export async function fetchWithAuth(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getAccessTokenOrThrow(); // ← always fresh

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-store",
    },
    cache: "no-store",
  });

  return res;
}


export async function handleResponse<T>(res: Response): Promise<T> {
  const body = await safeJson(res);

  if (!res.ok) {
    throw new Error(`${res.status}: ${body?.message || res.statusText || "Request failed"}`);
  }

  return body as T;
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text || "Non-JSON response" };
  }
}
