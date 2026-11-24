// Tests for the HubSpot tracking-status receiver. The pure validation
// helpers and the authentication middleware are tested directly here,
// with no mocking needed for either. The actual quote/shipment
// matching, stale/duplicate handling, conversion carry-through, and the
// conversion/update concurrency race were verified against a real,
// isolated local Postgres database (createdb on this machine, fully
// separate from Supabase, dropped after), running the REAL patched
// convert_quote_to_shipment (not a stand-in) — not simulated here,
// since Node-level mocking of that behavior would only prove the mock
// behaves as written, not that the actual SQL does. See this round's
// report for the exact scenarios run and their results. The receiver
// no longer accepts a timestamp in the request body at all — it fetches
// the authoritative value and change time directly from HubSpot's
// property history (getLatestTrackingStatusFromHubspot, in
// hubspotTickets.js) — so there is no timestamp-parsing helper left to
// test here.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidReferenceId,
  isValidTrackingStatus,
  requireSharedSecret,
} from '../../routes/hubspotSyncRouter.js';
import { escapeIlikeWildcards } from '../../routes/shipmentsRouter.js';
import { selectLatestPropertyHistoryEntry } from '../hubspotTickets.js';

describe('isValidReferenceId', () => {
  test('a well-formed RA reference is valid', () => {
    assert.equal(isValidReferenceId('RA-100306'), true);
  });

  test('lowercase is accepted (case-insensitive)', () => {
    assert.equal(isValidReferenceId('ra-100306'), true);
  });

  test('missing, empty, or malformed references are rejected', () => {
    assert.equal(isValidReferenceId(''), false);
    assert.equal(isValidReferenceId(null), false);
    assert.equal(isValidReferenceId(undefined), false);
    assert.equal(isValidReferenceId('100306'), false);
    assert.equal(isValidReferenceId('RA-abc'), false);
  });
});

describe('isValidTrackingStatus', () => {
  test('every one of the three confirmed HubSpot values is recognized', () => {
    assert.equal(isValidTrackingStatus('Quoted'), true);
    assert.equal(isValidTrackingStatus('Pending Booking'), true);
    assert.equal(isValidTrackingStatus('Preparing for Carrier Assignment'), true);
  });

  test('a legacy alias already in ALLOWED_STATUSES is still recognized', () => {
    assert.equal(isValidTrackingStatus('Driver Assigned'), true);
  });

  test('an unrecognized value is rejected, not silently accepted', () => {
    assert.equal(isValidTrackingStatus('Some Future Stage Nobody Confirmed Yet'), false);
    assert.equal(isValidTrackingStatus(''), false);
    assert.equal(isValidTrackingStatus(null), false);
  });
});

describe('escapeIlikeWildcards', () => {
  test('a plain email is unchanged', () => {
    assert.equal(escapeIlikeWildcards('info@caribbeanmotoring.com'), 'info@caribbeanmotoring.com');
  });

  test('a literal % in the value is escaped so it cannot act as a wildcard', () => {
    assert.equal(escapeIlikeWildcards('a%b@example.com'), 'a\\%b@example.com');
  });

  test('a literal _ in the value is escaped so it cannot match any single character', () => {
    assert.equal(escapeIlikeWildcards('a_b@example.com'), 'a\\_b@example.com');
  });

  test('a pre-existing backslash is escaped first, so it is not misread as part of a later escape', () => {
    assert.equal(escapeIlikeWildcards('a\\b%c'), 'a\\\\b\\%c');
  });
});

describe('selectLatestPropertyHistoryEntry', () => {
  test('picks the entry with the latest timestamp, not the first one in the array', () => {
    const history = [
      { value: 'Quoted', timestamp: '2026-01-01T00:00:00Z' },
      { value: 'In Transit', timestamp: '2026-03-01T00:00:00Z' },
      { value: 'Pending Booking', timestamp: '2026-02-01T00:00:00Z' },
    ];
    const result = selectLatestPropertyHistoryEntry(history);
    assert.equal(result.value, 'In Transit');
  });

  test('still works correctly if HubSpot returns entries already in reverse order', () => {
    const history = [
      { value: 'In Transit', timestamp: '2026-03-01T00:00:00Z' },
      { value: 'Pending Booking', timestamp: '2026-02-01T00:00:00Z' },
      { value: 'Quoted', timestamp: '2026-01-01T00:00:00Z' },
    ];
    const result = selectLatestPropertyHistoryEntry(history);
    assert.equal(result.value, 'In Transit');
  });

  test('ignores entries missing a value or an unparseable timestamp', () => {
    const history = [
      { value: 'Quoted', timestamp: '2026-01-01T00:00:00Z' },
      { value: null, timestamp: '2026-05-01T00:00:00Z' },
      { value: 'In Transit', timestamp: 'not-a-date' },
    ];
    const result = selectLatestPropertyHistoryEntry(history);
    assert.equal(result.value, 'Quoted');
  });

  test('an empty or missing array returns null, not a crash', () => {
    assert.equal(selectLatestPropertyHistoryEntry([]), null);
    assert.equal(selectLatestPropertyHistoryEntry(undefined), null);
    assert.equal(selectLatestPropertyHistoryEntry(null), null);
  });

  test('an array with no usable entries at all returns null', () => {
    const history = [{ value: null, timestamp: null }, { value: 'X', timestamp: 'garbage' }];
    assert.equal(selectLatestPropertyHistoryEntry(history), null);
  });
});

// requireSharedSecret — mocked req/res, no network or DB. Covers
// exactly the authentication behavior requested: missing server-side
// config, a missing header, a wrong header, and the correct secret.
function fakeReqRes(providedSecret) {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const req = {
    get(name) {
      return name === 'X-Webhook-Secret' ? providedSecret : undefined;
    },
  };
  return { req, res };
}

describe('requireSharedSecret', () => {
  test('rejects with 500 if the server-side secret is not configured at all', () => {
    delete process.env.TEST_TRACKING_SECRET_UNSET;
    const middleware = requireSharedSecret('TEST_TRACKING_SECRET_UNSET');
    const { req, res } = fakeReqRes('whatever');
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 500);
    assert.equal(nextCalled, false);
  });

  test('rejects with 401 when no secret header is provided', () => {
    process.env.TEST_TRACKING_SECRET = 'correct-value';
    const middleware = requireSharedSecret('TEST_TRACKING_SECRET');
    const { req, res } = fakeReqRes(undefined);
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  test('rejects with 401 when the wrong secret is provided', () => {
    process.env.TEST_TRACKING_SECRET = 'correct-value';
    const middleware = requireSharedSecret('TEST_TRACKING_SECRET');
    const { req, res } = fakeReqRes('wrong-value');
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  test('calls next() when the correct secret is provided', () => {
    process.env.TEST_TRACKING_SECRET = 'correct-value';
    const middleware = requireSharedSecret('TEST_TRACKING_SECRET');
    const { req, res } = fakeReqRes('correct-value');
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });
});
