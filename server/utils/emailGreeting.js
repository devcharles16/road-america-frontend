// Builds the "Hi <name>," greeting used in customer-facing status
// emails. Guards against more than JS null/undefined — upstream data
// can also contain the literal strings "null"/"undefined" (e.g. from a
// buggy string concatenation of a missing field), which would render
// to the customer exactly as typed if not caught here.

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isUsableNamePart(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !/^(null|undefined)$/i.test(trimmed);
}

/**
 * Prefers an explicit first name (e.g. quotes.first_name). Falls back
 * to the first word of a combined display name (e.g. customer_name —
 * all the shipments table has, since it has no first_name/last_name
 * columns of its own). Returns null when nothing usable is found, so
 * the caller can render a plain "Hi," instead of a broken greeting.
 */
export function resolveGreetingFirstName({ firstName, customerName } = {}) {
  if (isUsableNamePart(firstName)) {
    return firstName.trim();
  }
  if (isUsableNamePart(customerName)) {
    const firstWord = customerName.trim().split(/\s+/)[0];
    if (isUsableNamePart(firstWord)) {
      return firstWord;
    }
  }
  return null;
}

export function buildGreeting(nameFields) {
  const firstName = resolveGreetingFirstName(nameFields);
  return firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";
}
