// Focused tests for the notification-preferences token: a valid
// round-trip, rejection of a token signed with a different secret
// (proves secret-level purpose separation), rejection of a
// correctly-signed-but-wrong-shape payload (proves the "np." prefix
// defense works independently of the signature), expiry, and malformed
// input. Requires NOTIFICATION_PREFERENCES_SECRET to be set — the test
// runner (npm test) sets a placeholder if one isn't already present.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  generateNotificationPreferenceToken,
  verifyNotificationPreferenceToken,
} from '../notificationPreferenceLinks.js';

describe('notification preference tokens', () => {
  test('a freshly generated token verifies successfully with the correct, normalized email', () => {
    const token = generateNotificationPreferenceToken('Info@CaribbeanMotoring.com');
    const result = verifyNotificationPreferenceToken(token);
    assert.equal(result.valid, true);
    assert.equal(result.email, 'info@caribbeanmotoring.com');
  });

  test('a token signed with a different secret is rejected as a bad signature, never trusted', () => {
    const exp = Math.floor(Date.now() / 1000) + 1000;
    const payload = `np.someone@example.com.${exp}`;
    const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
    const wrongSignature = crypto.createHmac('sha256', 'a-totally-different-secret').update(payloadB64).digest('base64url');
    const forgedToken = `${payloadB64}.${wrongSignature}`;

    const result = verifyNotificationPreferenceToken(forgedToken);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'bad_signature');
  });

  test('a correctly-signed payload that is not purpose-tagged "np." is rejected — proves the purpose tag is enforced, not just the secret', () => {
    // Signs a booking-shaped payload with the SAME real secret this
    // module uses, to isolate the purpose-tag check specifically from
    // the secret check — this must fail even though the signature
    // itself is genuinely valid for this secret.
    const secret = process.env.NOTIFICATION_PREFERENCES_SECRET;
    const exp = Math.floor(Date.now() / 1000) + 1000;
    const bookingShapedPayload = `RA-100210.${exp}`;
    const payloadB64 = Buffer.from(bookingShapedPayload, 'utf8').toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const crossPurposeToken = `${payloadB64}.${signature}`;

    const result = verifyNotificationPreferenceToken(crossPurposeToken);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'malformed');
  });

  test('an expired token is rejected with reason "expired", not treated as malformed or valid', () => {
    const token = generateNotificationPreferenceToken('test@example.com', -10);
    const result = verifyNotificationPreferenceToken(token);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'expired');
  });

  test('garbage input is rejected as malformed, not thrown', () => {
    assert.equal(verifyNotificationPreferenceToken('').valid, false);
    assert.equal(verifyNotificationPreferenceToken(null).valid, false);
    assert.equal(verifyNotificationPreferenceToken('not-a-real-token').valid, false);
    assert.equal(verifyNotificationPreferenceToken('a.b.c.d').valid, false);
  });
});
