// Unit tests for the payment-capture safeguards. Covers only the pure
// error-classification logic that decides whether an uncertain Stripe
// response requires a follow-up retrieve() — see the capture-flow design
// notes for how the DB-layer guards (beginCapture's WHERE status =
// 'authorized', the widened unique index) were verified instead.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isAmbiguousStripeError } from '../stripeClient.js';

function stripeError(type, message = 'error') {
  const err = new Error(message);
  err.type = type;
  return err;
}

describe('isAmbiguousStripeError', () => {
  test('a connection error is ambiguous — the request may never have reached Stripe', () => {
    assert.equal(isAmbiguousStripeError(stripeError('StripeConnectionError')), true);
  });

  test("Stripe's own 5xx (StripeAPIError) is ambiguous", () => {
    assert.equal(isAmbiguousStripeError(stripeError('StripeAPIError')), true);
  });

  test('a clear invalid-request rejection (e.g. already canceled) is NOT ambiguous', () => {
    assert.equal(isAmbiguousStripeError(stripeError('StripeInvalidRequestError')), false);
  });

  test('a rate-limit error is NOT ambiguous — the request never started', () => {
    assert.equal(isAmbiguousStripeError(stripeError('StripeRateLimitError')), false);
  });

  test('a card error is NOT ambiguous', () => {
    assert.equal(isAmbiguousStripeError(stripeError('StripeCardError')), false);
  });

  test('an error with no .type at all is treated as ambiguous, out of caution', () => {
    assert.equal(isAmbiguousStripeError(new Error('some non-Stripe exception')), true);
  });

  test('no error at all is not ambiguous (nothing to resolve)', () => {
    assert.equal(isAmbiguousStripeError(null), false);
    assert.equal(isAmbiguousStripeError(undefined), false);
  });
});
