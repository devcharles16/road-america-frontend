// src/services/shipmentsService.ts
import { supabase } from "../lib/supabaseClient";


/** Base URL for your backend */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type TransportStatus =
  | "Submitted"
  | "Driver Assigned"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

export type RunningCondition = "running" | "non-running";
export type TransportType = "open" | "enclosed";

export type TransportRequest = {
  id: string;
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  vehicleYear?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vin?: string | null;
  runningCondition?: RunningCondition | null;
  transportType?: TransportType | null;
  status: TransportStatus;
  eta?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransportInput = {
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vin?: string;
  runningCondition?: RunningCondition;
  transportType?: TransportType;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  userId?: string;
};

/** QUOTES */
export type CreateQuoteInput = {
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

  runningCondition?: RunningCondition;
  transportType?: TransportType;

  preferredPickupWindow?: string;
  vehicleHeightMod?: string;
  notes?: string;
};

/** Keep this minimal to avoid snake_case vs camelCase mismatch */
export type QuoteCreated = {
  id: string;
  referenceId: string; // RA-100000 etc
};

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function handleResponse<T>(res: Response): Promise<T> {
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
 */
export async function createQuote(
  input: CreateQuoteInput
): Promise<QuoteCreated> {
  const res = await fetch(`${API_BASE_URL}/api/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  // Backend returns { id, referenceId, ...data }
  const data = await handleResponse<any>(res);

  return {
    id: data.id,
    referenceId: data.referenceId,
  };
}

/**
 * PUBLIC: Create a new shipment directly (NOT the quote page anymore)
 * POST /api/shipments
 *
 * You can keep this for “direct booking” flows.
 */
export async function createTransportRequest(
  input: CreateTransportInput
): Promise<TransportRequest> {
  const res = await fetch(`${API_BASE_URL}/api/shipments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  // TEMP DEBUG — remove later
  if (!res.ok) {
    const text = await res.text();
    console.error("Create shipment failed:", res.status, text);
    throw new Error(`Create shipment failed: ${res.status}`);
  }

  const created = await res.json();
  console.log("✅ Created shipment:", created);

  return created;
}

/**
 * ADMIN/EMPLOYEE: List all shipments
 * GET /api/shipments
 */
export async function listShipments(): Promise<TransportRequest[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

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
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/shipments/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  return handleResponse<TransportRequest>(res);
}

 // ================================
  // API: List shipments for logged-in client
  // ================================
  // Calls backend endpoint: GET /api/my-shipments
  // Backend MUST:
  // - Validate Supabase JWT from Authorization header
  // - Determine user identity (user id + email)
  // - Return shipments for that user (commonly user_id OR customer_email)
  //
  // If this returns [], check:
  // - shipments.user_id is null (very common if shipments were created from quotes)
  // - backend is filtering only by user_id
  // - token parsing / auth middleware
  // ================================
export async function listMyShipments(): Promise<TransportRequest[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/my-shipments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-store", // helps avoid “it feels cached” issues
    },
    cache: "no-store",
  });

  return handleResponse<TransportRequest[]>(res);
}


/**
 * PUBLIC: Track a specific shipment by reference ID + email
 * GET /api/track?referenceId=...&email=...
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
