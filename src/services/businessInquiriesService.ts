import { API_BASE_URL } from "../config/api";

export type BusinessInquiryInput = {
  firstName: string;
  lastName: string;
  businessName: string;
  jobTitle?: string;
  email: string;
  phone: string;

  businessType?: string;
  transportNeed?: string;
  estimatedVolume?: string;

  pickupCityState?: string;
  deliveryCityState?: string;
  additionalDetails?: string;

  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  qrCampaign?: string;

  captchaToken: string;
};

/** Public: submit a business (B2B) transport inquiry */
export async function createBusinessInquiry(input: BusinessInquiryInput): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE_URL}/api/business-inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to submit business inquiry");
  }

  return res.json();
}
