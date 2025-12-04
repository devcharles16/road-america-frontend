// src/services/shipmentsService.ts
import { supabase } from "../lib/supabaseClient";

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
  // optional: for logged-in clients later
  userId?: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
 * PUBLIC: Create a new transport request (quote submission)
 * POST /api/shipments
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
 */
export async function listShipments(): Promise<TransportRequest[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE_URL}/api/shipments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
  if (!token) {
    throw new Error("Not authenticated");
  }

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

/**
 * CLIENT: List shipments for the currently logged-in client
 * GET /api/my-shipments
 */
export async function listMyShipments(): Promise<TransportRequest[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE_URL}/api/my-shipments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

  if (res.status === 404) {
    return null;
  }

  return handleResponse<TransportRequest>(res);
}
