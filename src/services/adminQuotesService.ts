import { API_BASE_URL } from "../config/api";
import { supabase } from "../lib/supabaseClient";

// IMPORTANT: Keep this string EXACT across UI + filtering.
export const QUOTE_STATUS_CLOSED_NOT_CONVERTED =
  "Closed - Not Converted" as const;

export type AdminQuoteRow = {
  id: string;
  reference_id?: string | null;

  first_name?: string | null;
  last_name?: string | null;

  customer_email?: string | null;
  customer_phone?: string | null;

  pickup_city?: string | null;
  pickup_state?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;

  vehicle_year?: string | number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;

  transport_type?: string | null;
  running_condition?: string | null;
  pickup_window?: string | null;
  vehicle_height_mod?: string | null;

  quote_status?: string | null;
  created_at?: string | null;
};

async function getAccessTokenOrThrow(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Missing access token. Please log in again.");
  return token;
}

/**
 * Admin list of quotes (default: hides "Closed - Not Converted").
 */
export async function adminListQuotes(): Promise<AdminQuoteRow[]> {
  const token = await getAccessTokenOrThrow();

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
  const rows = Array.isArray(json) ? (json as AdminQuoteRow[]) : [];

  // Default behavior: hide quotes that were closed as "not converted".
  return rows.filter(
    (r) => (r.quote_status ?? "") !== QUOTE_STATUS_CLOSED_NOT_CONVERTED
  );
}

/**
 * Converts a quote into a shipment using your backend API.
 * Signature kept compatible with existing callers.
 */
export async function adminConvertQuoteToShipment(
  quoteId: string,
  userId?: string | null
): Promise<void> {
  if (!quoteId) throw new Error("quoteId is required");

  const token = await getAccessTokenOrThrow();

  const res = await fetch(`${API_BASE_URL}/api/shipments/from-quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quoteId, userId: userId ?? null }),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got ${contentType}. First 120 chars: ${text.slice(0, 120)}`
    );
  }

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const msg = (json && (json.message || json.error)) || "Failed to convert quote";
    throw new Error(msg);
  }

  // Caller doesn't need the payload.
  await res.json().catch(() => null);
}

/**
 * Marks a quote as "Closed - Not Converted".
 *
 * NOTE: This uses Supabase directly. If your RLS blocks it for admins,
 * we can swap this to a backend endpoint (recommended long-term).
 */
export async function adminCloseQuoteNotConverted(quoteId: string): Promise<void> {
  if (!quoteId) throw new Error("quoteId is required");

  const { error } = await supabase
    .from("quotes")
    .update({ quote_status: QUOTE_STATUS_CLOSED_NOT_CONVERTED })
    .eq("id", quoteId);

  if (error) throw error;
}
