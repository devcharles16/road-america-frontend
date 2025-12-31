import { API_BASE_URL } from "../config/api";

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
  referenceId: string; // RA-100000 etc
};

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
