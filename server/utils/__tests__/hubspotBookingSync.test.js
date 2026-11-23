// Focused unit tests for the five-property HubSpot sync (Customer Card
// Hold Status, Pickup/Delivery POC, Earliest Pickup Date, Special
// Instructions). Covers only the pure formatting/conversion logic — the
// actual HTTP calls to HubSpot and the webhook/route wiring that decides
// WHEN to call them are verified by code review and by the live Sandbox
// test plan (see the deployment notes), the same boundary already used
// for every other HubSpot-sync test in this project.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatPoc, toHubspotDateMillis } from '../hubspotTickets.js';

describe('formatPoc', () => {
  test('full set of fields, including a unit, formats as four lines', () => {
    const result = formatPoc({
      contactName: 'Alex Tester',
      contactPhone: '(305) 555-0199',
      address: '450 NW 52nd St',
      unit: 'Apt 4B',
      city: 'Coconut Creek',
      state: 'FL',
      zip: '33073',
    });
    assert.equal(result, 'Alex Tester\n(305) 555-0199\n450 NW 52nd St, Apt 4B\nCoconut Creek, FL 33073');
  });

  test('no unit — the street line has no trailing comma or blank', () => {
    const result = formatPoc({
      contactName: 'Jordan Tester',
      contactPhone: '(404) 555-0177',
      address: '1200 Peachtree St NE',
      unit: '',
      city: 'Atlanta',
      state: 'GA',
      zip: '30309',
    });
    assert.equal(result, 'Jordan Tester\n(404) 555-0177\n1200 Peachtree St NE\nAtlanta, GA 30309');
  });

  test('missing fields are omitted, not rendered as "undefined"', () => {
    const result = formatPoc({ contactName: 'Alex Tester', contactPhone: '', address: '', unit: '', city: '', state: '', zip: '' });
    assert.equal(result, 'Alex Tester');
    assert.ok(!result.includes('undefined'));
  });

  test('all fields empty produces an empty string, not a crash', () => {
    const result = formatPoc({});
    assert.equal(result, '');
  });
});

describe('toHubspotDateMillis', () => {
  test('a valid date converts to the correct midnight-UTC epoch-ms string', () => {
    assert.equal(toHubspotDateMillis('2026-12-05'), '1796428800000');
  });

  test('an empty/missing value returns null (caller omits the property)', () => {
    assert.equal(toHubspotDateMillis(''), null);
    assert.equal(toHubspotDateMillis(null), null);
    assert.equal(toHubspotDateMillis(undefined), null);
  });

  test('an unparseable value returns null rather than "NaN"', () => {
    assert.equal(toHubspotDateMillis('not-a-date'), null);
  });
});
