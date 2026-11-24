// Signed, expiring links for the "Manage shipment notifications" page.
//
// Deliberately NOT sharing bookingLinks.js's module or secret, even
// though the underlying construction is the same (HMAC-SHA256 over a
// base64url payload, timing-safe comparison) — a booking token and a
// notification-preferences token must never be interchangeable, even
// under a misconfiguration. Two independent layers enforce that:
//   1. A completely separate secret (NOTIFICATION_PREFERENCES_SECRET).
//      A token signed with BOOKING_LINK_SECRET will never verify here,
//      full stop, regardless of payload shape.
//   2. The signed payload itself starts with a literal "np." purpose
//      tag and holds an email, not a reference id — even in the
//      hypothetical case of both secrets being identical by mistake, a
//      real booking token's payload ("RA-100210.<exp>") doesn't start
//      with "np." and is rejected before its fields are ever parsed.
//
// Token shape: base64url(`np.${normalizedEmail}.${expiresAtUnixSeconds}`)
// + "." + HMAC-SHA256 signature of the base64url payload.
//
// Expiry: a fresh token is minted into every status-update email, not
// mailed once and reused forever — so a customer who's still receiving
// updates always has a current link in their latest email. The 180-day
// default is generous enough to outlive any realistic shipment
// lifecycle (weeks, not months) while still bounding a given link's
// lifetime. A customer holding a genuinely expired link (e.g. digging
// up a very old email for a shipment that's long since stopped
// sending updates) has no self-service way to get a fresh one in this
// MVP — intentionally, since building that would mean an email-based
// login/magic-link flow, which is explicitly out of scope here. They'd
// need to contact support directly; documenting that plainly rather
// than building around it.
import crypto from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 180; // 180 days
const PURPOSE_PREFIX = "np";

function getSecret() {
  const secret = process.env.NOTIFICATION_PREFERENCES_SECRET;
  if (!secret) throw new Error("NOTIFICATION_PREFERENCES_SECRET is not set");
  return secret;
}

function sign(payloadB64) {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function generateNotificationPreferenceToken(email, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("Cannot generate a notification-preference token without an email.");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  // Email goes LAST, as the remainder after the first two fields — not
  // split uniformly on "." like the other fields, since a real email
  // address almost always contains its own dots (e.g. ".com") and a
  // naive split(".") would wrongly fragment it.
  const payload = `${PURPOSE_PREFIX}.${exp}.${normalized}`;
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * Returns one of:
 *  { valid: true, email, exp }
 *  { valid: false, reason: "malformed" | "bad_signature" | "expired" }
 */
export function verifyNotificationPreferenceToken(token) {
  if (!token || typeof token !== "string") return { valid: false, reason: "malformed" };

  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "malformed" };
  const [payloadB64, signature] = parts;

  let expectedSignature;
  try {
    expectedSignature = sign(payloadB64);
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const providedBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, reason: "bad_signature" };
  }

  let payload;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return { valid: false, reason: "malformed" };
  }

  // Parsed positionally, not by a uniform split(".") — the email (the
  // third field) is everything after the second dot, since it almost
  // always contains dots of its own (e.g. ".com") that must not be
  // mistaken for field separators.
  const firstDot = payload.indexOf(".");
  if (firstDot === -1) return { valid: false, reason: "malformed" };
  const prefix = payload.slice(0, firstDot);
  const rest = payload.slice(firstDot + 1);

  const secondDot = rest.indexOf(".");
  if (secondDot === -1) return { valid: false, reason: "malformed" };
  const expStr = rest.slice(0, secondDot);
  const email = rest.slice(secondDot + 1);

  if (prefix !== PURPOSE_PREFIX) {
    // Not a malformed accident — this is exactly the case of a
    // differently-purposed token (or garbage) that happens to carry a
    // valid-looking signature structure. Reject it the same as any
    // other malformed input; never treat it as "close enough."
    return { valid: false, reason: "malformed" };
  }

  const exp = Number(expStr);
  if (!email || !Number.isFinite(exp)) return { valid: false, reason: "malformed" };

  if (Math.floor(Date.now() / 1000) > exp) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, email, exp };
}

export function generateNotificationPreferencesUrl(email, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const baseUrl = process.env.FRONTEND_URL || "https://www.roadamericatransport.com";
  const token = generateNotificationPreferenceToken(email, ttlSeconds);
  return `${baseUrl}/manage-notifications?token=${token}`;
}
