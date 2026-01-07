// src/services/shipmentsService.ts
//
// ✅ Notes (why this rewrite)
// - This file mixes PUBLIC (no login), CUSTOMER (logged-in customer), and ADMIN/EMPLOYEE endpoints.
// - Your 403 issue was caused because the CUSTOMER endpoint `/api/my-shipments` was using
//   `getAccessTokenOrThrow()` (an admin-style helper) instead of the customer session token.
// - Fix: `listMyShipments()` now pulls the access token directly from Supabase auth.
//
// ✅ Rules of thumb
// - PUBLIC endpoints: no Authorization header
// - CUSTOMER endpoints: use `supabase.auth.getSession()` and send Bearer access_token
// - ADMIN/EMPLOYEE endpoints: use `getAccessTokenOrThrow()` (if that helper enforces role/admin)

import { API_BASE_URL } from "../config/api";
import { supabase } from "../lib/supabaseClient"; // ✅ customer session token lives here
import { getAccessTokenOrThrow } from "./apiClient"; // ✅ keep for admin/employee routes only

export type TransportStatus =
  | "Submitted"
  | "Driver Assigned"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

export type RunningCondition = "running" | "non-running";
export type TransportType = "open" | "enclosed";

/**
 * Shipment row returned by backend.
 * Notes:
 * - Keep fields optional-ish to avoid TS breakage if backend adds/removes fields.
 * - Your UI can still rely on required fields like id/referenceId where appropriate.
 */
export type TransportRequest = {
  id: string;
  referenceId: string;

  // Customer
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;

  // Route
  pickupCity?: string | null;
  pickupState?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;

  // Vehicle
  vehicleYear?: string | number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vin?: string | null;

  // Shipment details
  runningCondition?: RunningCondition | string | null;
  transportType?: TransportType | string | null;
  pickupWindow?: string | null;
  vehicleHeightMod?: string | null;

  notes?: string | null;
  status?: TransportStatus | string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  // optional linkage
  quoteId?: string | null;
};

/** PUBLIC: Quote intake payload (no login required) */
export type CreateQuoteInput = {
  firstName?: string | null;
  lastName?: string | null;
  customerName?: string | null;

  customerEmail?: string | null;
  customerPhone?: string | null;

  pickupCity?: string | null;
  pickupState?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;

  vehicleYear?: string | number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vin?: string | null;

  runningCondition?: RunningCondition | string | null;
  transportType?: TransportType | string | null;

  preferredPickupWindow?: string | null;
  vehicleHeightMod?: string | null;

  notes?: string | null;
  captchaToken?: string | null;
};

export type QuoteCreated = {
  id: string;
  referenceId: string;
};

/** PUBLIC: Shipment intake payload (if you keep a public create-shipment request flow) */
export type CreateTransportInput = {
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;

  pickupCity?: string | null;
  pickupState?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;

  vehicleYear?: string | number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vin?: string | null;

  runningCondition?: RunningCondition | string | null;
  transportType?: TransportType | string | null;

  pickupWindow?: string | null;
  vehicleHeightMod?: string | null;

  notes?: string | null;
};

async function handleResponse<T>(res: Response): Promise<T> {
  // NOTE: This keeps the error message readable if backend returns JSON or plain text.
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API error (${res.status}): ${text || res.statusText || "Unknown error"}`
    );
  }
  return res.json() as Promise<T>;
}

/**
 * PUBLIC: Create a new QUOTE
 * POST /api/quotes
 *
 * Notes:
 * - No Authorization header (public lead form)
 * - Backend returns { id, referenceId, ... }
 */
export async function createQuote(input: CreateQuoteInput): Promise<QuoteCreated> {
  const res = await fetch(`${API_BASE_URL}/api/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await handleResponse<any>(res);

  return {
    id: data.id,
    referenceId: data.referenceId,
  };
}

/**
 * PUBLIC: Create a new shipment request
 * POST /api/shipments
 *
 * Notes:
 * - Keep this public only if your backend is designed that way.
 * - If you intend "shipments" to be customer-authenticated only, we should add Authorization here later.
 */
export async function createTransportRequest(
  input: CreateTransportInput
): Promise<TransportRequest> {
  const res = await fetch(`${API_BASE_URL}/api/shipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return handleResponse<TransportRequest>(res);
}

/**
 * ADMIN/EMPLOYEE: List all shipments
 * GET /api/shipments
 *
 * Notes:
 * - This should stay using getAccessTokenOrThrow() if that helper enforces admin/employee permissions.
 */
export async function listShipments(): Promise<TransportRequest[]> {
  const token = await getAccessTokenOrThrow();
  const res = await fetch(`${API_BASE_URL}/api/shipments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleResponse<TransportRequest[]>(res);
}

/**
 * ADMIN/EMPLOYEE: Update a shipment's status
 * PATCH /api/shipments/:id/status
 */
export async function updateShipmentStatus(
  id: string,
  status: TransportStatus
): Promise<TransportRequest> {
  const token = await getAccessTokenOrThrow();
  const res = await fetch(`${API_BASE_URL}/api/shipments/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  return handleResponse<TransportRequest>(res);
}

/**
 * CUSTOMER: List shipments for the currently logged-in customer
 * GET /api/my-shipments
 *
 * ✅ Key change (fixes your 403 regression):
 * - Use the current Supabase session access_token (customer auth)
 * - Do NOT use getAccessTokenOrThrow() here (that’s for admin/employee flows)
 */
export async function listMyShipments(): Promise<TransportRequest[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  // Notes:
  // - If the UI calls this before auth hydration finishes, accessToken can be null.
  // - In that case, the page should redirect to /login or wait until auth loading completes.
  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE_URL}/api/my-shipments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-store", // helps avoid “it feels cached” issues
    },
    cache: "no-store",
  });

  return handleResponse<TransportRequest[]>(res);
}

/**
 * PUBLIC: Track a specific shipment by reference ID + email
 * GET /api/track?referenceId=...&email=...
 *
 * Notes:
 * - No auth required
 * - Returns null if not found (404)
 */
export async function trackShipmentByRefAndEmail(
  referenceId: string,
  email: string
): Promise<TransportRequest | null> {
  const params = new URLSearchParams({
    referenceId: referenceId.trim(),
    email: email.trim(),
  });

  const res = await fetch(`${API_BASE_URL}/api/track?${params.toString()}`);

  if (res.status === 404) return null;

  return handleResponse<TransportRequest>(res);
}
