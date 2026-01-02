import { API_BASE_URL } from "../config/api";
import { supabase } from "../lib/supabaseClient";

export type AdminQuoteRow = {
  id: string;
  reference_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  customer_email?: string | null;
  pickup_city?: string | null;
  pickup_state?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  created_at?: string | null;
};

export async function adminListQuotes(): Promise<AdminQuoteRow[]> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new Error("Missing access token. Please log in again.");

  const res = await fetch(`${API_BASE_URL}/api/quotes`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got ${contentType}. First 120 chars: ${text.slice(0, 120)}`
    );
  }

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to load quotes");
  }

  const json = await res.json();
  return Array.isArray(json) ? json : [];
}
