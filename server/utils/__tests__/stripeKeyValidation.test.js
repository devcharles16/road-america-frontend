// Focused tests for the Sandbox/Live key-prefix correction: both
// standard secret keys (sk_...) and restricted keys (rk_...) must be
// accepted identically, and the strict environment-mismatch guard must
// still reject every wrong pairing exactly as before.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateStripeKeyEnvironment } from '../stripeClient.js';

describe('validateStripeKeyEnvironment — accepted key prefixes', () => {
  test('sk_test_ with sandbox is accepted', () => {
    assert.doesNotThrow(() => validateStripeKeyEnvironment('sk_test_abc123', 'sandbox'));
  });

  test('rk_test_ with sandbox is accepted (the actual bug being fixed)', () => {
    assert.doesNotThrow(() => validateStripeKeyEnvironment('rk_test_abc123', 'sandbox'));
  });

  test('sk_live_ with live is accepted', () => {
    assert.doesNotThrow(() => validateStripeKeyEnvironment('sk_live_abc123', 'live'));
  });

  test('rk_live_ with live is accepted (the actual bug being fixed)', () => {
    assert.doesNotThrow(() => validateStripeKeyEnvironment('rk_live_abc123', 'live'));
  });
});

describe('validateStripeKeyEnvironment — mismatch protection still strict', () => {
  test('a live standard key under sandbox is rejected', () => {
    assert.throws(() => validateStripeKeyEnvironment('sk_live_abc123', 'sandbox'), /not 'live'/);
  });

  test('a live restricted key under sandbox is rejected', () => {
    assert.throws(() => validateStripeKeyEnvironment('rk_live_abc123', 'sandbox'), /not 'live'/);
  });

  test('a test standard key under live is rejected', () => {
    assert.throws(() => validateStripeKeyEnvironment('sk_test_abc123', 'live'), /refusing to start/);
  });

  test('a test restricted key under live is rejected', () => {
    assert.throws(() => validateStripeKeyEnvironment('rk_test_abc123', 'live'), /refusing to start/);
  });

  test('an unrecognized prefix is rejected regardless of environment', () => {
    assert.throws(() => validateStripeKeyEnvironment('pk_live_abc123', 'live'), /does not look like a Stripe secret key/);
  });

  test('a missing key is rejected', () => {
    assert.throws(() => validateStripeKeyEnvironment('', 'sandbox'), /is not set/);
    assert.throws(() => validateStripeKeyEnvironment(null, 'live'), /is not set/);
  });

  test('an invalid STRIPE_ENVIRONMENT value is rejected even with a valid key', () => {
    assert.throws(() => validateStripeKeyEnvironment('sk_test_abc123', 'production'), /must be set to 'sandbox' or 'live'/);
  });
});
