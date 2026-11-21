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
// NANP decimal form: optional leading country code 1, then area code and
// exchange code, neither of which may start with 0 or 1 in a real US
// number. Deliberately stricter than "10-15 digits" — this is "valid U.S.
// format", not "plausible length for some country".
const US_PHONE_RE = /^[2-9]\d{2}[2-9]\d{6}$/;

const safe = s => String(s ?? '').trim();

function isValidPhone(value) {
  let digits = safe(value).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return US_PHONE_RE.test(digits);
}

// Placeholder text a customer should never actually submit as their real
// information — kept in sync with the <input placeholder="..."> values in
// booking.html. The browser's placeholder attribute is never sent as a
// field's value in ordinary use, so this exists only as a backend-enforced
// backstop against autofill, copy-paste, or a client that skips the UI
// entirely; the frontend's own looksLikePlaceholder() check is the same
// list and only a convenience, not the security boundary.
const PLACEHOLDER_VALUES = new Set([
  'e.g., 123 main street',
  'apt, suite, or unit #',
  '5-digit zip code',
  'first and last name',
  '(555) 555-0123',
  'e.g., gated community, call before arrival',
]);
const PLACEHOLDER_GUARDED_FIELDS = [
  'pickupAddress', 'pickupUnit', 'pickupContactName', 'pickupContactPhone',
  'deliveryAddress', 'deliveryUnit', 'deliveryContactName', 'deliveryContactPhone',
  'specialInstructions',
];

// Coarse ZIP3-prefix -> state sanity check, not an authoritative database.
// USPS allocates 3-digit ZIP prefixes to states in large, mostly
// contiguous blocks; this catches an obviously wrong ZIP (e.g. a Texas ZIP
// entered for a Miami, FL address) without needing a full ZIP/city/state
// dataset. Numbers are written without leading zeros (039 -> 39) since
// leading-zero numeric literals are best avoided in JS; matching is done
// against parseInt(zip.slice(0,3)), which parses "039" as 39 the same way.
const ZIP3_RANGES_BY_STATE = {
  AL: [[350, 369]], AK: [[995, 999]], AZ: [[850, 865]], AR: [[716, 729]],
  CA: [[900, 961]], CO: [[800, 816]], CT: [[60, 69]], DE: [[197, 199]],
  DC: [[200, 205]], FL: [[320, 349]], GA: [[300, 319], [398, 399]], HI: [[967, 968]],
  ID: [[832, 838]], IL: [[600, 629]], IN: [[460, 479]], IA: [[500, 528]],
  KS: [[660, 679]], KY: [[400, 427]], LA: [[700, 715]], ME: [[39, 49]],
  MD: [[206, 219]], MA: [[10, 27], [55, 55]], MI: [[480, 499]], MN: [[550, 567]],
  MS: [[386, 397]], MO: [[630, 658]], MT: [[590, 599]], NE: [[680, 693]],
  NV: [[889, 898]], NH: [[30, 38]], NJ: [[70, 89]], NM: [[870, 884]],
  NY: [[100, 149]], NC: [[270, 289]], ND: [[580, 588]], OH: [[430, 459]],
  OK: [[730, 749]], OR: [[970, 979]], PA: [[150, 196]], RI: [[28, 29]],
  SC: [[290, 299]], SD: [[570, 577]], TN: [[370, 385]], TX: [[750, 799], [885, 885]],
  UT: [[840, 847]], VT: [[50, 59]], VA: [[201, 201], [220, 246]], WA: [[980, 994]],
  WV: [[247, 268]], WI: [[530, 549]], WY: [[820, 831]],
  PR: [[6, 9]], VI: [[8, 8]], GU: [[969, 969]], AS: [[967, 969]], MP: [[969, 969]],
  AE: [[90, 98]], AP: [[962, 966]],
};

// Unrecognized state codes (a typo, an uncommon military designation, etc.)
// fail open rather than blocking the customer outright — this table isn't
// exhaustive, and ZIP_RE above already enforces the basic 5-digit shape.
function isZipConsistentWithState(zip, state) {
  const ranges = ZIP3_RANGES_BY_STATE[safe(state).toUpperCase()];
  if (!ranges) return true;
  const prefix = parseInt(safe(zip).slice(0, 3), 10);
  if (Number.isNaN(prefix)) return false;
  return ranges.some(([lo, hi]) => prefix >= lo && prefix <= hi);
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

  for (const key of PLACEHOLDER_GUARDED_FIELDS) {
    const v = fields[key];
    if (v && PLACEHOLDER_VALUES.has(v.toLowerCase())) {
      return { valid: false, error: `${key} looks like the example placeholder text, not your actual information.` };
    }
  }

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

  if (!isZipConsistentWithState(fields.pickupZip, fields.pickupState)) {
    return { valid: false, error: 'pickupZip does not match the selected pickup state.' };
  }
  if (!isZipConsistentWithState(fields.deliveryZip, fields.deliveryState)) {
    return { valid: false, error: 'deliveryZip does not match the selected delivery state.' };
  }

  if (!isValidPhone(fields.pickupContactPhone)) return { valid: false, error: 'pickupContactPhone is not a valid U.S. phone number.' };
  if (!isValidPhone(fields.deliveryContactPhone)) return { valid: false, error: 'deliveryContactPhone is not a valid U.S. phone number.' };

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
