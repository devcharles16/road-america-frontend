// Unit tests for the duplicate-authorization safeguards added ahead of
// Stripe Live Mode activation. Covers only the pure logic that can be
// tested without a real Supabase/Stripe connection — see the production
// readiness report for how the DB-layer (unique index) and live
// webhook-replay behavior were verified instead.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildCheckoutIdempotencyKey } from '../packagePricing.js';
import { selectDuplicateAuthorizations } from '../paymentAuthorizations.js';

describe('buildCheckoutIdempotencyKey', () => {
  test('is deterministic for identical inputs (protects against simultaneous Checkout sessions)', () => {
    const input = { referenceId: 'RA-100295', pkg: 'gold', amountCents: 150000 };
    assert.equal(buildCheckoutIdempotencyKey(input), buildCheckoutIdempotencyKey({ ...input }));
  });

  test('changes when amountCents changes (a real price change is never blocked by a stale cached key)', () => {
    const base = { referenceId: 'RA-100295', pkg: 'gold', amountCents: 150000 };
    const changed = { ...base, amountCents: 160000 };
    assert.notEqual(buildCheckoutIdempotencyKey(base), buildCheckoutIdempotencyKey(changed));
  });

  test('changes when the package changes', () => {
    const base = { referenceId: 'RA-100295', pkg: 'gold', amountCents: 150000 };
    const changed = { ...base, pkg: 'silver' };
    assert.notEqual(buildCheckoutIdempotencyKey(base), buildCheckoutIdempotencyKey(changed));
  });

  test('changes when the reference changes (never collides across two different bookings)', () => {
    const base = { referenceId: 'RA-100295', pkg: 'gold', amountCents: 150000 };
    const changed = { ...base, referenceId: 'RA-100296' };
    assert.notEqual(buildCheckoutIdempotencyKey(base), buildCheckoutIdempotencyKey(changed));
  });
});

describe('selectDuplicateAuthorizations', () => {
  test('a single authorized row has no duplicates', () => {
    const rows = [{ id: 1, stripe_payment_intent_id: 'pi_1', authorized_at: '2026-01-01T00:00:00Z' }];
    const { keep, duplicates } = selectDuplicateAuthorizations(rows);
    assert.equal(keep.id, 1);
    assert.deepEqual(duplicates, []);
  });

  test('no rows at all is handled without throwing', () => {
    const { keep, duplicates } = selectDuplicateAuthorizations([]);
    assert.equal(keep, null);
    assert.deepEqual(duplicates, []);
  });

  test('keeps the earliest-authorized row and flags every other one as a duplicate, regardless of input order', () => {
    const earliest = { id: 1, stripe_payment_intent_id: 'pi_1', authorized_at: '2026-01-01T00:00:00Z' };
    const middle = { id: 2, stripe_payment_intent_id: 'pi_2', authorized_at: '2026-01-01T00:00:05Z' };
    const latest = { id: 3, stripe_payment_intent_id: 'pi_3', authorized_at: '2026-01-01T00:00:10Z' };

    // Deliberately out of chronological order, as Supabase could return
    // rows in any order without an explicit ORDER BY.
    const { keep, duplicates } = selectDuplicateAuthorizations([latest, earliest, middle]);

    assert.equal(keep.id, 1);
    assert.deepEqual(duplicates.map(d => d.id), [2, 3]);
  });

  test('never selects the row it is keeping as one of its own duplicates', () => {
    const rows = [
      { id: 10, stripe_payment_intent_id: 'pi_10', authorized_at: '2026-02-01T00:00:00Z' },
      { id: 11, stripe_payment_intent_id: 'pi_11', authorized_at: '2026-02-01T00:00:01Z' },
    ];
    const { keep, duplicates } = selectDuplicateAuthorizations(rows);
    assert.ok(!duplicates.some(d => d.id === keep.id));
  });
});
