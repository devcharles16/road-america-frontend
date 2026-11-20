import { API_BASE_URL } from "../config/api";
import { supabase } from "../lib/supabaseClient";

export type AdminBookingQuote = {
  reference_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  vehicle_year?: string | number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  pickup_city?: string | null;
  pickup_state?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  transport_type?: string | null;
  running_condition?: string | null;
  pickup_window?: string | null;
  vehicle_height_mod?: string | null;
  pricing_status?: string | null;
  silver_total_price?: number | null;
  gold_total_price?: number | null;
};

export type AdminBookingSelection = {
  package?: "silver" | "gold" | null;
  created_at?: string | null;
};

export type AdminBookingDetails = {
  reference_id?: string | null;
  pickup_address?: string | null;
  pickup_unit?: string | null;
  pickup_city?: string | null;
  pickup_state?: string | null;
  pickup_zip?: string | null;
  pickup_contact_name?: string | null;
  pickup_contact_phone?: string | null;
  delivery_address?: string | null;
  delivery_unit?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_zip?: string | null;
  delivery_contact_name?: string | null;
  delivery_contact_phone?: string | null;
  vehicle_available_date?: string | null;
  special_instructions?: string | null;
  status?: "ready_for_payment" | "review_required" | "payment_authorized" | "posted_to_central_dispatch" | null;
  revision?: number | null;
  pending_customer_confirmation?: boolean | null;
  material_change_detected?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminBookingAuditEntry = {
  action: string;
  performed_by?: string | null;
  performed_at: string;
  details?: Record<string, unknown> | null;
};

export type AdminBookingView = {
  quote: AdminBookingQuote;
  selection: AdminBookingSelection | null;
  details: AdminBookingDetails | null;
  auditLog: AdminBookingAuditEntry[] | null;
};

async function getAccessTokenOrThrow(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Missing access token. Please log in again.");
  return token;
}

async function parseJsonOrThrow(res: Response, fallbackMessage: string) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON but got ${contentType}. First 120 chars: ${text.slice(0, 120)}`);
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json && (json.message || json.error)) || fallbackMessage);
  }
  return json;
}

/**
 * Looks up a booking by RA-###### reference for the admin/employee
 * dashboard. Returns quote + package selection + booking details (if any)
 * + audit log (admin only — the backend omits it entirely for employees,
 * not just hides it client-side).
 */
export async function adminGetBooking(referenceId: string): Promise<AdminBookingView> {
  const token = await getAccessTokenOrThrow();
  const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${encodeURIComponent(referenceId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJsonOrThrow(res, "Failed to load booking.");
}

/**
 * Admin-only: approves every material field currently on the booking's
 * details as valid, clearing the review_required flag. Does not clear a
 * pending customer-confirmation requirement, if one exists — only the
 * customer's own confirmation can do that.
 *
 * expectedRevision must be the `details.revision` from the same booking
 * view the admin is looking at — the backend rejects the approval as
 * stale if the booking has changed since (e.g. the customer resubmitted
 * while the admin had this page open).
 */
export async function adminResolveBookingReview(
  referenceId: string,
  expectedRevision: number
): Promise<{ ok: boolean; status: string }> {
  const token = await getAccessTokenOrThrow();
  const res = await fetch(
    `${API_BASE_URL}/api/admin/booking-details/${encodeURIComponent(referenceId)}/resolve-review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ expectedRevision }),
    }
  );
  return parseJsonOrThrow(res, "Failed to resolve review.");
}
