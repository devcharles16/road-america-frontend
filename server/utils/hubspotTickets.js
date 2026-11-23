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

/**
 * Writes the outcome of a capture attempt (Succeeded or Failed) back to
 * the matching ticket's Capture Status/Captured Amount/Captured Date/
 * Capture Error properties. One-directional, same as
 * syncSelectedPackageToHubspot — the backend only ever writes these
 * properties, never reads them back as input to anything, and this never
 * throws: by the time this runs, Supabase already durably reflects the
 * real outcome, so a HubSpot sync failure must not affect that.
 */
export async function syncCaptureResultToHubspot(referenceId, { status, amountCents, capturedAt, error }) {
  try {
    const ticketId = await findTicketIdByQuoteNumber(referenceId);
    if (!ticketId) return;

    const properties = { [CAPTURE_STATUS_PROPERTY]: status };
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
  } catch (err) {
    console.error(`HubSpot capture-result sync failed for ${referenceId}:`, err);
  }
}
