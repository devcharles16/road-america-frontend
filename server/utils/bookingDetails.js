// Validation and the atomic write for the guided booking details step
// (pickup/delivery address, contacts, vehicle availability, terms
// acceptance). All writes go through upsert_booking_details(),
// resolve_material_change_review(), and confirm_booking_revision()
// (booking_details_setup.sql) — those functions own the concurrency,
// material-change-matching, and revision-confirmation guarantees; this
// module only validates input shape and calls them.
//
// actorType/actorId must always be derived server-side from the
// authenticated session (req.user / req.userRole after requireAuth), never
// from the request body — see booking_details_setup.sql's file header.
// There is currently no caller that passes actorType: 'employee' at all,
// since employee-assisted editing is intentionally not enabled yet.
import supabase from '../supabaseClient.js';

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const PHONE_DIGITS_MIN = 10;
const PHONE_DIGITS_MAX = 15;

const safe = s => String(s ?? '').trim();

function isValidPhone(value) {
  const digits = safe(value).replace(/\D/g, '');
  return digits.length >= PHONE_DIGITS_MIN && digits.length <= PHONE_DIGITS_MAX;
}

function isValidFutureOrTodayDate(value) {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return d.getTime() >= todayUtc.getTime();
}

/**
 * Validates the raw submission. Returns { valid: true, fields } with every
 * field trimmed/normalized, or { valid: false, error } describing the first
 * problem found.
 */
export function validateBookingDetails(body) {
  const fields = {
    pickupAddress: safe(body.pickupAddress),
    pickupUnit: body.pickupUnit == null ? null : safe(body.pickupUnit),
    pickupCity: safe(body.pickupCity),
    pickupState: safe(body.pickupState),
    pickupZip: safe(body.pickupZip),
    pickupContactName: safe(body.pickupContactName),
    pickupContactPhone: safe(body.pickupContactPhone),
    deliveryAddress: safe(body.deliveryAddress),
    deliveryUnit: body.deliveryUnit == null ? null : safe(body.deliveryUnit),
    deliveryCity: safe(body.deliveryCity),
    deliveryState: safe(body.deliveryState),
    deliveryZip: safe(body.deliveryZip),
    deliveryContactName: safe(body.deliveryContactName),
    deliveryContactPhone: safe(body.deliveryContactPhone),
    vehicleAvailableDate: safe(body.vehicleAvailableDate),
    specialInstructions: body.specialInstructions == null ? null : safe(body.specialInstructions),
    termsVersion: safe(body.termsVersion),
  };

  const requiredText = [
    'pickupAddress', 'pickupCity', 'pickupState', 'pickupContactName',
    'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryContactName',
    'termsVersion',
  ];
  for (const key of requiredText) {
    if (!fields[key]) return { valid: false, error: `${key} is required.` };
  }

  if (!ZIP_RE.test(fields.pickupZip)) return { valid: false, error: 'pickupZip is not a valid ZIP code.' };
  if (!ZIP_RE.test(fields.deliveryZip)) return { valid: false, error: 'deliveryZip is not a valid ZIP code.' };

  if (!isValidPhone(fields.pickupContactPhone)) return { valid: false, error: 'pickupContactPhone is not a valid phone number.' };
  if (!isValidPhone(fields.deliveryContactPhone)) return { valid: false, error: 'deliveryContactPhone is not a valid phone number.' };

  if (!isValidFutureOrTodayDate(fields.vehicleAvailableDate)) {
    return { valid: false, error: 'vehicleAvailableDate must be a valid date, today or later.' };
  }

  if (body.termsAccepted !== true) {
    return { valid: false, error: 'Booking terms must be accepted.' };
  }

  return { valid: true, fields };
}

/**
 * Calls upsert_booking_details(). Returns { status, materialChangeDetected,
 * previousStatus, justEnteredReview, locked, pendingCustomerConfirmation,
 * revision }.
 */
export async function upsertBookingDetails(referenceId, fields, { actorType = 'customer', actorId = null } = {}) {
  const now = new Date().toISOString();
  const { data, error } = await supabase.rpc('upsert_booking_details', {
    p_reference_id: referenceId,
    p_pickup_address: fields.pickupAddress,
    p_pickup_unit: fields.pickupUnit,
    p_pickup_city: fields.pickupCity,
    p_pickup_state: fields.pickupState,
    p_pickup_zip: fields.pickupZip,
    p_pickup_contact_name: fields.pickupContactName,
    p_pickup_contact_phone: fields.pickupContactPhone,
    p_delivery_address: fields.deliveryAddress,
    p_delivery_unit: fields.deliveryUnit,
    p_delivery_city: fields.deliveryCity,
    p_delivery_state: fields.deliveryState,
    p_delivery_zip: fields.deliveryZip,
    p_delivery_contact_name: fields.deliveryContactName,
    p_delivery_contact_phone: fields.deliveryContactPhone,
    p_vehicle_available_date: fields.vehicleAvailableDate,
    p_special_instructions: fields.specialInstructions,
    p_terms_version: fields.termsVersion,
    p_now: now,
    p_actor_type: actorType,
    p_actor_id: actorId,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    status: row.out_status,
    materialChangeDetected: row.out_material_change_detected,
    previousStatus: row.out_previous_status,
    justEnteredReview: row.out_just_entered_review,
    locked: row.out_locked,
    pendingCustomerConfirmation: row.out_pending_customer_confirmation,
    revision: row.out_revision,
  };
}

/**
 * Calls resolve_material_change_review(). expectedRevision must be the
 * revision the admin actually reviewed (from the same GET response the
 * dashboard rendered) — the function rejects the call as stale_revision
 * if the row has moved on since. Returns { resolved, status,
 * currentRevision, reason }.
 */
export async function resolveMaterialChangeReview(referenceId, staffUserId, expectedRevision) {
  const { data, error } = await supabase.rpc('resolve_material_change_review', {
    p_reference_id: referenceId,
    p_staff_id: staffUserId,
    p_expected_revision: expectedRevision,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    resolved: row.out_resolved,
    status: row.out_status,
    currentRevision: row.out_current_revision,
    reason: row.out_reason,
  };
}

/**
 * Calls confirm_booking_revision(). Returns { confirmed, currentRevision,
 * reason }. reason is 'stale_revision' when the caller's revision no
 * longer matches the row's current one — the caller must re-fetch the
 * latest details and ask the customer to review again before confirming.
 */
export async function confirmBookingRevision(referenceId, revision) {
  const { data, error } = await supabase.rpc('confirm_booking_revision', {
    p_reference_id: referenceId,
    p_revision: revision,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    confirmed: row.out_confirmed,
    currentRevision: row.out_current_revision,
    reason: row.out_reason,
  };
}

/**
 * Called by stripeWebhookRouter.js right after a checkout.session.completed
 * event is recorded as authorized. Plain WHERE-guarded update, not a
 * Postgres function — there is no business logic here beyond the single
 * status flip, same pattern as paymentAuthorizations.js's own writes.
 *
 * WHERE status = 'ready_for_payment' makes this a safe no-op on duplicate
 * webhook delivery (the row is already 'payment_authorized', not
 * 'ready_for_payment', so a second call changes nothing) and on a row that
 * was never actually submitted as ready (nothing to lock).
 *
 * upsert_booking_details() already refuses any further edit once status
 * leaves ('ready_for_payment', 'review_required') — see
 * booking_details_setup.sql — so this single flip is what makes the
 * approved pickup/delivery details immutable once payment is authorized,
 * with no separate locking mechanism needed.
 */
export async function lockBookingDetailsForAuthorizedPayment(referenceId) {
  const { error } = await supabase
    .from('booking_details')
    .update({ status: 'payment_authorized', updated_at: new Date().toISOString() })
    .eq('reference_id', referenceId)
    .eq('status', 'ready_for_payment');
  if (error) throw error;
}

/**
 * Called by stripeWebhookRouter.js when an authorization that previously
 * reached 'payment_authorized' is lost (payment_intent.canceled, with the
 * prior payment_authorizations status genuinely 'authorized' — see that
 * router for why this is distinct from a PaymentIntent that never reached
 * requires_capture at all). Reverses lockBookingDetailsForAuthorizedPayment
 * so a new create-checkout-session-by-token attempt is not blocked by
 * booking_details still reading 'payment_authorized' for an authorization
 * Stripe itself no longer honors.
 *
 * WHERE status = 'payment_authorized' makes this a safe no-op if this
 * reference was never locked in the first place, or was already unlocked
 * by a prior delivery of this same event.
 */
export async function unlockBookingDetailsAfterAuthorizationLoss(referenceId) {
  const { error } = await supabase
    .from('booking_details')
    .update({ status: 'ready_for_payment', updated_at: new Date().toISOString() })
    .eq('reference_id', referenceId)
    .eq('status', 'payment_authorized');
  if (error) throw error;
}
