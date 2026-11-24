// Single shared entry point for a shipment/quote status-change
// notification — called from BOTH write paths (the admin manual-status
// PATCH route and the HubSpot tracking-bridge route), so there is one
// place that decides whether an email goes out, not two drifting
// implementations. Never called unless the caller has already
// confirmed the status genuinely changed (see shipmentsRouter.js's
// atomic PATCH guard and apply_website_tracking_status's own
// status-distinct check) — this function does not re-derive that; it
// trusts the caller's "this was a real change" decision and focuses
// only on whether the customer wants to hear about it.
import supabase from "../supabaseClient.js";
import { sendStatusUpdate } from "./transportStatus.js";
import { generateNotificationPreferencesUrl } from "../utils/notificationPreferenceLinks.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Looks up whether this customer has opted out. No row at all means
 * enabled — the table only needs a row once someone changes away from
 * the default. Fails OPEN (treats a lookup error as "enabled") rather
 * than silently suppressing a real notification over an infrastructure
 * hiccup — the preference check itself is a courtesy, not a security
 * boundary, so erring toward sending matches the "restore working
 * notifications" intent better than erring toward silence.
 */
async function isEnabledForCustomer(normalizedEmail) {
  try {
    const { data, error } = await supabase
      .from("customer_notification_preferences")
      .select("shipment_status_emails_enabled")
      .eq("customer_email", normalizedEmail)
      .maybeSingle();
    if (error) throw error;
    return data ? data.shipment_status_emails_enabled : true;
  } catch (err) {
    console.error(`Notification preference lookup failed for ${normalizedEmail}; defaulting to enabled:`, err);
    return true;
  }
}

/**
 * Sends (or correctly suppresses) a shipment status-change
 * notification. Never throws — logged only on any failure, per the
 * approved MVP scope: there is no automatic retry here. The status
 * write that triggered this call has already succeeded and durably
 * reflects the new status regardless of what happens in this function;
 * nothing here can undo or roll that back.
 */
export async function notifyShipmentStatusChange({ referenceId, status, customerEmail, customerName }) {
  const normalizedEmail = normalizeEmail(customerEmail);
  if (!normalizedEmail) {
    console.error(`Skipping status notification for ${referenceId}: no customer email on file.`);
    return;
  }

  try {
    const enabled = await isEnabledForCustomer(normalizedEmail);
    if (!enabled) {
      console.log(`Status notification suppressed for ${referenceId} (${normalizedEmail}): customer has opted out.`);
      return;
    }

    const manageUrl = generateNotificationPreferencesUrl(normalizedEmail);
    const result = await sendStatusUpdate(customerEmail, customerName, status, referenceId, manageUrl);
    if (!result?.success) {
      console.error(`Status notification email failed for ${referenceId} (${normalizedEmail}):`, result?.error);
    }
  } catch (err) {
    // Logged only, not retried — an accepted MVP limitation, not a
    // "recovered" failure. The tracking/status write this followed is
    // already durable and is never affected by anything here.
    console.error(`Status notification error for ${referenceId} (${normalizedEmail}):`, err);
  }
}
