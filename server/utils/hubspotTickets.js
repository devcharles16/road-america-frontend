// Writes the customer's confirmed package back to the matching HubSpot
// ticket's Selected Package property. One-directional, narrow: this never
// creates a ticket, never touches pipeline stage, and only ever PATCHes the
// single property it's told to.
//
// Uses Node's built-in fetch (Node 20 here) — no new dependency.

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const QUOTE_NUMBER_PROPERTY = 'quote_number';
const SELECTED_PACKAGE_PROPERTY = 'selected_package';

function getToken() {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) throw new Error('HUBSPOT_PRIVATE_APP_TOKEN is not set');
  return token;
}

/**
 * Finds the single ticket whose `quote_number` property matches the given
 * reference. Returns the ticket id, or null if zero or more than one ticket
 * matched — callers must treat null as "do not write," not as "pick one."
 */
async function findTicketIdByQuoteNumber(referenceId) {
  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/tickets/search`, {
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
  const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/tickets/${ticketId}`, {
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
