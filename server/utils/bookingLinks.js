// Signed, expiring booking links for /book/silver and /book/gold.
//
// Token shape: base64url(`${referenceId}.${expiresAtUnixSeconds}`) + "." + signature
// Signature = HMAC-SHA256 of the base64url payload, keyed by BOOKING_LINK_SECRET.
//
// Any edit to the reference id or expiry changes the payload, which changes
// the signature — so neither can be modified without invalidating the token.
// Verification uses a constant-time comparison to avoid timing attacks.
// Node's built-in crypto only; no new dependency.
import crypto from "node:crypto";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days — see summary for rationale.

function getSecret() {
  const secret = process.env.BOOKING_LINK_SECRET;
  if (!secret) throw new Error("BOOKING_LINK_SECRET is not set");
  return secret;
}

function sign(payloadB64) {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function generateBookingToken(referenceId, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${referenceId}.${exp}`;
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * Returns one of:
 *  { valid: true, referenceId, exp }
 *  { valid: false, reason: "malformed" | "bad_signature" }
 *  { valid: false, reason: "expired", referenceId }   // signature checked out; only time ran out
 */
export function verifyBookingToken(token) {
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

  const sepIndex = payload.lastIndexOf(".");
  if (sepIndex === -1) return { valid: false, reason: "malformed" };

  const referenceId = payload.slice(0, sepIndex);
  const exp = Number(payload.slice(sepIndex + 1));
  if (!referenceId || !Number.isFinite(exp)) return { valid: false, reason: "malformed" };

  if (Math.floor(Date.now() / 1000) > exp) {
    // Signature is genuinely valid here — expiry is a separate business
    // rule, not a tamper check — so it's safe to hand back the reference id
    // (e.g. to prefill "your link for RA-100210 has expired" on the page).
    return { valid: false, reason: "expired", referenceId };
  }

  return { valid: true, referenceId, exp };
}

/**
 * One shared token works for both package pages: it only ever proves "this
 * link is authorized to view/act on this specific quote," independent of
 * which package the customer ultimately picks.
 */
export function generateBookingUrls(referenceId, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const baseUrl = process.env.BOOKING_SITE_URL || "https://www.roadamericatransport.com";
  const token = generateBookingToken(referenceId, ttlSeconds);
  return {
    goldBookingUrl: `${baseUrl}/book/gold?token=${token}`,
    silverBookingUrl: `${baseUrl}/book/silver?token=${token}`,
  };
}
