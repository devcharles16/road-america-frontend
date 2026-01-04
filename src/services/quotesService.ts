import { API_BASE_URL } from "../config/api";
import { fetchWithAuth, handleResponse, getAccessTokenOrThrow } from "./apiClient";

export type QuoteCreateInput = {
  firstName: string;
  lastName: string;
  customerEmail: string;
  customerPhone?: string;

  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;

  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vin?: string;

  runningCondition?: string;
  transportType?: string;

  preferredPickupWindow?: string;
  vehicleHeightMod?: string;
};

export type QuoteRecord = {
  id: string;
  referenceId: string;
};

export type AdminQuoteRow = {
  id: string;
  referenceId?: string | null;

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

  running_condition?: string | null;
  transport_type?: string | null;

  pickup_window?: string | null;
  vehicle_height_mod?: string | null;

  quote_status?: string | null;
  created_at?: string | null;
};


/** Public: create a quote */
export async function createQuote(input: QuoteCreateInput): Promise<QuoteRecord> {
  const res = await fetch(`${API_BASE_URL}/api/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.lastName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,

      pickupCity: input.pickupCity,
      pickupState: input.pickupState,
      deliveryCity: input.deliveryCity,
      deliveryState: input.deliveryState,

      vehicleYear: input.vehicleYear,
      vehicleMake: input.vehicleMake,
      vehicleModel: input.vehicleModel,
      vin: input.vin,

      runningCondition: input.runningCondition,
      transportType: input.transportType,

      preferredPickupWindow: input.preferredPickupWindow,
      vehicleHeightMod: input.vehicleHeightMod,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to create quote");
  }

  const data = await res.json();
  return { id: data.id, referenceId: data.referenceId };
}

/**
 * ADMIN/EMPLOYEE: list all quotes
 * GET /api/quotes
 */
export async function adminListQuotes(): Promise<AdminQuoteRow[]> {
  const token = await getAccessTokenOrThrow();

  const res = await fetch(`${API_BASE_URL}/api/quotes`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleResponse<AdminQuoteRow[]>(res);


}

/**
 * ADMIN: Convert a quote to a shipment
 * POST /api/shipments/from-quote
 *
 * IMPORTANT:
 * - Uses fetchWithAuth() so we always send the freshest token
 * - Uses handleResponse() so 401/500 errors don’t look like “empty data”
 */
export async function adminConvertQuoteToShipment(
  quoteId: string,
  userId?: string | null
) {
  const res = await fetchWithAuth("/api/shipments/from-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quoteId, userId: userId ?? null }),
  });

  return handleResponse(res);
}


