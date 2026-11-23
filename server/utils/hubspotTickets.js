// Writes the customer's confirmed package back to the matching HubSpot
// ticket's Selected Package property. One-directional, narrow: this never
// creates a ticket, never touches pipeline stage, and only ever PATCHes the
// single property it's told to.
//
// Uses Node's built-in fetch (Node 20 here) — no new dependency.

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const QUOTE_NUMBER_PROPERTY = 'quote_number';
const SELECTED_PACKAGE_PROPERTY = 'selected_package';
const REQUEST_TIMEOUT_MS = 8000;

// Exact internal HubSpot property names this code writes to. These must
// be created in HubSpot with these exact internal names (the "Internal
// name" field when creating a custom property, not just the display
// label) before this sync can do anything — see the capture-flow
// deployment notes for the full list and types.
const CAPTURE_STATUS_PROPERTY = 'capture_status';
const CAPTURED_AMOUNT_PROPERTY = 'captured_amount';
const CAPTURED_DATE_PROPERTY = 'captured_date';
const CAPTURE_ERROR_PROPERTY = 'capture_error';

// The INPUT property the HubSpot workflow sets to trigger a capture, and
// the label (not yet confirmed to also be the internal value — see
// getNoRequestOptionValue) it gets reset to afterward so the trigger can
// fire again for a future legitimate request on the same ticket.
const PAYMENT_CAPTURE_REQUEST_PROPERTY = 'payment_capture_request';
const NO_REQUEST_LABEL = 'No Request';

// The five employee-facing booking/authorization properties.
// customer_card_hold_status is distinct from capture_status above — it
// tracks whether a hold currently exists at all, independent of whether
// it's later captured.
const CUSTOMER_CARD_HOLD_STATUS_PROPERTY = 'customer_card_hold_status';
const PICKUP_POC_PROPERTY = 'pickup_poc';
const DELIVERY_POC_PROPERTY = 'delivery_poc';
const EARLIEST_PICKUP_DATE_PROPERTY = 'earliest_pickup_date';
const SPECIAL_INSTRUCTIONS_PROPERTY = 'special_instructions';

function getToken() {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) throw new Error('HUBSPOT_PRIVATE_APP_TOKEN is not set');
  return token;
}

// An unresponsive HubSpot API must not hang the booking confirmation
// request indefinitely — this is awaited inline from confirmSelection().
// Bounds each call (search, then patch) to REQUEST_TIMEOUT_MS.
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`HubSpot request to ${url} timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Finds the single ticket whose `quote_number` property matches the given
 * reference. Returns the ticket id, or null if zero or more than one ticket
 * matched — callers must treat null as "do not write," not as "pick one."
 */
async function findTicketIdByQuoteNumber(referenceId) {
  const res = await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/tickets/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [{ propertyName: QUOTE_NUMBER_PROPERTY, operator: 'EQ', value: referenceId }],
        },
      ],
      properties: [QUOTE_NUMBER_PROPERTY],
      limit: 2,
    }),
  });

  if (!res.ok) {
    throw new Error(`HubSpot ticket search failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const results = data?.results || [];

  if (results.length !== 1) {
    console.error(
      `HubSpot ticket lookup for ${referenceId} returned ${results.length} tickets; expected exactly 1. Skipping Selected Package sync.`
    );
    return null;
  }

  return results[0].id;
}

/**
 * Reads a ticket's own quote_number property directly by id — used to
 * validate a caller-supplied ticket id actually belongs to the reference
 * being processed, before ever writing to it. Returns null (never
 * throws) on any failure, so the caller falls back to the search-based
 * lookup instead of blocking on this.
 */
async function getTicketQuoteNumber(ticketId) {
  try {
    const res = await fetchWithTimeout(
      `${HUBSPOT_API_BASE}/crm/v3/objects/tickets/${ticketId}?properties=${QUOTE_NUMBER_PROPERTY}`,
      { method: 'GET', headers: { Authorization: `Bearer ${getToken()}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.properties?.[QUOTE_NUMBER_PROPERTY] ?? null;
  } catch (err) {
    console.error(`Failed to read quote_number for HubSpot ticket ${ticketId}:`, err);
    return null;
  }
}

/**
 * Resolves the ticket to write to for a given reference. If a ticket id
 * was supplied (e.g. by the Zapier capture workflow, which already has
 * it from its own trigger), it's used ONLY after confirming that
 * ticket's own quote_number actually matches this reference — a
 * mismatch or failed check silently falls back to the existing
 * search-by-quote_number lookup rather than ever writing to an
 * unverified ticket.
 */
async function resolveTicketId(referenceId, suppliedTicketId) {
  if (suppliedTicketId) {
    const quoteNumber = await getTicketQuoteNumber(suppliedTicketId);
    if (quoteNumber && String(quoteNumber).trim().toUpperCase() === String(referenceId).trim().toUpperCase()) {
      return suppliedTicketId;
    }
    console.error(
      `Supplied ticketId ${suppliedTicketId} does not match reference ${referenceId} (ticket's quote_number: ${quoteNumber ?? 'unavailable'}); falling back to search-by-quote_number.`
    );
  }
  return await findTicketIdByQuoteNumber(referenceId);
}

// Cached for the life of the process — the option's internal value for a
// given label won't change at runtime, and this avoids one extra
// HubSpot API call per capture request after the first.
let cachedNoRequestValue = null;

/**
 * Looks up the ACTUAL internal value behind the "No Request" option on
 * the Payment Capture Request property, rather than assuming the label
 * and the internal value are the same string. Throws if the property or
 * that exact label can't be found — callers must treat that as "don't
 * reset," not as "guess a value and write it anyway."
 */
async function getNoRequestOptionValue() {
  if (cachedNoRequestValue) return cachedNoRequestValue;

  const res = await fetchWithTimeout(
    `${HUBSPOT_API_BASE}/crm/v3/properties/tickets/${PAYMENT_CAPTURE_REQUEST_PROPERTY}`,
    { method: 'GET', headers: { Authorization: `Bearer ${getToken()}` } }
  );
  if (!res.ok) {
    throw new Error(`HubSpot property lookup failed for ${PAYMENT_CAPTURE_REQUEST_PROPERTY} (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const option = (data.options || []).find(o => o.label === NO_REQUEST_LABEL);
  if (!option) {
    throw new Error(`No option labeled "${NO_REQUEST_LABEL}" found on property ${PAYMENT_CAPTURE_REQUEST_PROPERTY}.`);
  }
  cachedNoRequestValue = option.value;
  return cachedNoRequestValue;
}

/**
 * Resets Payment Capture Request back to its idle option after
 * processing, so the HubSpot workflow's trigger can fire again for a
 * future legitimate request on the same ticket. Never throws — see
 * finalizeCaptureOutcome for why a failure here must never affect
 * anything already decided about the capture itself.
 */
async function resetPaymentCaptureRequest(ticketId) {
  const noRequestValue = await getNoRequestOptionValue();
  const res = await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties: { [PAYMENT_CAPTURE_REQUEST_PROPERTY]: noRequestValue } }),
  });
  if (!res.ok) {
    throw new Error(`HubSpot Payment Capture Request reset failed (${res.status}): ${await res.text()}`);
  }
}

async function setSelectedPackage(ticketId, packageValue) {
  const res = await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { [SELECTED_PACKAGE_PROPERTY]: packageValue },
    }),
  });

  if (!res.ok) {
    throw new Error(`HubSpot ticket update failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Formats one side's contact + address into the single multi-line block
 * Pickup POC / Delivery POC display: name, phone, street (+ unit if
 * present), then city/state/zip. Pure — no HubSpot call, no Supabase
 * call — so it's directly unit-testable. Any missing field is simply
 * omitted from its line rather than producing "undefined".
 */
export function formatPoc({ contactName, contactPhone, address, unit, city, state, zip }) {
  const lines = [];
  if (contactName) lines.push(contactName);
  if (contactPhone) lines.push(contactPhone);
  const streetLine = [address, unit].filter(Boolean).join(', ');
  if (streetLine) lines.push(streetLine);
  const cityLine = [[city, state].filter(Boolean).join(', '), zip].filter(Boolean).join(' ');
  if (cityLine) lines.push(cityLine);
  return lines.join('\n');
}

/**
 * Converts a plain 'YYYY-MM-DD' date (as stored in
 * booking_details.vehicle_available_date) to the midnight-UTC epoch-
 * milliseconds string HubSpot's API expects for a date-type property.
 * Returns null for anything empty or unparseable, so the caller can
 * simply omit the property rather than write a bad value. Pure — no
 * network call — directly unit-testable.
 */
export function toHubspotDateMillis(dateString) {
  if (!dateString) return null;
  const ms = Date.parse(`${dateString}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return String(ms);
}

/**
 * PATCHes the given properties on a ticket, logging any failure WITHOUT
 * the property values or HubSpot's raw response body — only the
 * reference id, the property NAMES involved, and the HTTP status. The
 * booking-details properties this guards (pickup/delivery POC) contain
 * real customer names, phone numbers, and addresses; a HubSpot
 * validation error can echo submitted values back in its response body,
 * so that body is deliberately never logged. Never throws.
 */
async function patchPropertiesSafely(ticketId, referenceId, properties) {
  const propertyNames = Object.keys(properties);
  try {
    const res = await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    });
    if (!res.ok) {
      console.error(`HubSpot sync failed for ${referenceId} (properties: ${propertyNames.join(', ')}): HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    // err.message here is fetchWithTimeout's own timeout notice (names
    // only the URL) or a network-level error — never HubSpot's response
    // body — so this is safe to log as-is.
    console.error(`HubSpot sync failed for ${referenceId} (properties: ${propertyNames.join(', ')}):`, err.message);
    return false;
  }
}

/**
 * Syncs exactly the four booking-detail properties: Pickup POC, Delivery
 * POC, Earliest Pickup Date, Special Instructions. Deliberately does
 * NOT touch Customer Card Hold Status — that property has exactly one
 * pair of writers, the Stripe authorization/cancellation webhook
 * handlers (see syncCardHoldStatusToHubspot), so a booking-details
 * update (which can happen before OR, via a delayed/retried request,
 * racing against an authorization) can never overwrite a confirmed
 * "Authorized" back to "Not Authorized". HubSpot's own default value
 * for the property covers the pre-authorization state; this function
 * has no opinion on it at all. Never throws — see patchPropertiesSafely
 * and syncSelectedPackageToHubspot for why.
 */
export async function syncBookingDetailsToHubspot(referenceId, fields) {
  try {
    const ticketId = await findTicketIdByQuoteNumber(referenceId);
    if (!ticketId) return;

    const properties = {
      [PICKUP_POC_PROPERTY]: formatPoc({
        contactName: fields.pickupContactName,
        contactPhone: fields.pickupContactPhone,
        address: fields.pickupAddress,
        unit: fields.pickupUnit,
        city: fields.pickupCity,
        state: fields.pickupState,
        zip: fields.pickupZip,
      }),
      [DELIVERY_POC_PROPERTY]: formatPoc({
        contactName: fields.deliveryContactName,
        contactPhone: fields.deliveryContactPhone,
        address: fields.deliveryAddress,
        unit: fields.deliveryUnit,
        city: fields.deliveryCity,
        state: fields.deliveryState,
        zip: fields.deliveryZip,
      }),
      [SPECIAL_INSTRUCTIONS_PROPERTY]: fields.specialInstructions || '',
    };

    const earliestDateMillis = toHubspotDateMillis(fields.vehicleAvailableDate);
    if (earliestDateMillis != null) properties[EARLIEST_PICKUP_DATE_PROPERTY] = earliestDateMillis;

    await patchPropertiesSafely(ticketId, referenceId, properties);
  } catch (err) {
    console.error(`HubSpot booking-details sync failed for ${referenceId} (ticket lookup):`, err.message);
  }
}

/**
 * Syncs only Customer Card Hold Status — the ONLY writer of this
 * property. Used by the Stripe webhook at the two moments that actually
 * change it: a real authorization confirmed ("Authorized"), or a real
 * authorization lost to expiry or cancellation before capture ("Not
 * Authorized"). Never throws.
 */
export async function syncCardHoldStatusToHubspot(referenceId, status) {
  try {
    const ticketId = await findTicketIdByQuoteNumber(referenceId);
    if (!ticketId) return;
    await patchPropertiesSafely(ticketId, referenceId, { [CUSTOMER_CARD_HOLD_STATUS_PROPERTY]: status });
  } catch (err) {
    console.error(`HubSpot card-hold-status sync failed for ${referenceId} (ticket lookup):`, err.message);
  }
}

/**
 * Looks up the ticket for this quote reference and sets its Selected
 * Package property to "Gold" or "Silver". Never throws — a failure here
 * (no token configured, no matching ticket, HubSpot API error) is logged
 * and swallowed, since the booking selection is already durably saved in
 * Supabase by the time this runs; a HubSpot sync problem must not affect
 * what the customer sees.
 */
export async function syncSelectedPackageToHubspot(referenceId, pkg) {
  const packageValue = pkg === 'gold' ? 'Gold' : 'Silver';
  try {
    const ticketId = await findTicketIdByQuoteNumber(referenceId);
    if (!ticketId) return;
    await setSelectedPackage(ticketId, packageValue);
  } catch (err) {
    console.error(`HubSpot Selected Package sync failed for ${referenceId}:`, err);
  }
}

// Maps this codebase's internal capture outcomes to the two Capture
// Status values HubSpot is known to display (Succeeded/Failed — see the
// original capture-flow proposal). The real distinction between e.g.
// "capture_failed" and "capture_uncertain" lives in the free-text
// Capture Error message, not in this property, unless Capture Status is
// later given more options — update this map if so.
const CAPTURE_STATUS_LABELS = {
  captured: 'Succeeded',
  already_captured: 'Succeeded',
  capture_in_progress: 'Failed',
  capture_failed: 'Failed',
  capture_uncertain: 'Failed',
  no_active_authorization: 'Failed',
};

async function setCaptureProperties(ticketId, { result, amountCents, capturedAt, error }) {
  const properties = { [CAPTURE_STATUS_PROPERTY]: CAPTURE_STATUS_LABELS[result] || 'Failed' };
  if (amountCents != null) properties[CAPTURED_AMOUNT_PROPERTY] = (amountCents / 100).toFixed(2);
  if (capturedAt) properties[CAPTURED_DATE_PROPERTY] = new Date(capturedAt).toISOString();
  if (error) properties[CAPTURE_ERROR_PROPERTY] = error;

  const res = await fetchWithTimeout(`${HUBSPOT_API_BASE}/crm/v3/objects/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    throw new Error(`HubSpot ticket update failed (${res.status}): ${await res.text()}`);
  }
}

/**
 * Writes the outcome of a capture request back to HubSpot: the four
 * Capture Status/Amount/Date/Error properties, then resets Payment
 * Capture Request back to idle so the workflow's trigger can fire again
 * later. Called only AFTER Supabase already durably reflects the real
 * outcome (see hubspotSyncRouter.js) — never throws, and the two writes
 * are independently try/caught, so a failure in either (or both) can
 * never cause the caller to attempt another Stripe capture; it only
 * means this specific HubSpot sync needs a manual look and retry later.
 * `ticketId` is the optional caller-supplied id (validated against
 * referenceId inside resolveTicketId before use); omit it to always use
 * the existing search-by-quote_number lookup.
 */
export async function finalizeCaptureOutcome(referenceId, { ticketId, result, amountCents, capturedAt, error } = {}) {
  let resolvedTicketId;
  try {
    resolvedTicketId = await resolveTicketId(referenceId, ticketId);
  } catch (err) {
    console.error(`Could not resolve a HubSpot ticket for ${referenceId}; skipping HubSpot sync entirely:`, err);
    return;
  }
  if (!resolvedTicketId) return;

  try {
    await setCaptureProperties(resolvedTicketId, { result, amountCents, capturedAt, error });
  } catch (err) {
    console.error(
      `HubSpot capture-result sync failed for ${referenceId} (ticket ${resolvedTicketId}); Supabase already durably reflects "${result}" — this HubSpot write needs a manual retry:`,
      err
    );
  }

  try {
    await resetPaymentCaptureRequest(resolvedTicketId);
  } catch (err) {
    console.error(
      `Failed to reset Payment Capture Request for ${referenceId} (ticket ${resolvedTicketId}) after processing — may need a manual reset in HubSpot before a future request on this ticket can trigger again:`,
      err
    );
  }
}
