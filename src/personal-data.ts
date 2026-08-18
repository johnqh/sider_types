// Recognising a personal value by its SHAPE, not by what a site called it.
//
// Shared rather than browser-only, because the two sides need the same answer.
// The extension redacts what it sends; the server redacts what it KEEPS — a
// user's typed request has to arrive intact for the agent to act on it, and
// nothing says the copy retained afterwards must still hold their address.
// One recogniser, so those two decisions cannot drift apart.
//
// Field names are a losing game on their own: a card arrives as `pan`, `cc1` or
// `number`, and page text has no field names at all. What travels is a body, a
// URL, the rendered text of the page and the user's own words — and prose is
// where an order confirmation prints a delivery address that no name list will
// ever see.
//
// Every rule here is CHECKSUMMED or strongly structured, and that is the whole
// design. A redactor that guesses destroys the content the corpus exists to
// hold: nine digits are a routing number, an order id, a product code and a
// timestamp, and a rule that cannot tell them apart is worse than no rule,
// because it quietly empties the corpus while claiming to protect someone.
//
// So: IBAN and routing numbers are verified by their own check digits, cards by
// Luhn, and the patterns without a checksum (address, ZIP, name) require
// context a false positive does not have.

/** An IBAN: country, check digits, then the account, verified mod-97. */
const IBAN_CANDIDATE = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;

/** Nine digits: a US routing number, or a great many other things. */
const ROUTING_CANDIDATE = /\b\d{9}\b/g;

/**
 * A US SSN, hyphenated only.
 *
 * Bare nine digits are deliberately NOT matched: that is an order number as
 * often as a person, and the hyphens are what make the intent unambiguous.
 * The excluded ranges are the ones the SSA never issues, which removes the
 * bulk of lookalike sequences.
 */
const SSN_PATTERN = /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;

/**
 * A phone number that was WRITTEN as one.
 *
 * Separators, parentheses or a country code are required. A bare run of ten
 * digits is an order id, a SKU or a tracking number far more often than a
 * phone, and redacting those would gut ordinary commerce pages.
 */
const PHONE_PATTERN =
  /(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)[ .-]?|\b\d{3}[ .-])\d{3}[ .-]\d{4}\b/g;

/** Street suffixes, spelled out or abbreviated. */
const STREET_SUFFIX =
  "street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|terrace|ter|place|pl|circle|cir|parkway|pkwy|highway|hwy|square|sq";

/**
 * A street address: a building number, a name, and a suffix.
 *
 * The suffix is what carries the precision. "123 Main Street" is an address;
 * "123 Main" is a heading, a product name or half a sentence, and requiring the
 * suffix is what separates them without a dictionary of street names.
 */
const STREET_PATTERN = new RegExp(
  String.raw`\b\d{1,6}\s+(?:[A-Za-z0-9.'-]+\s+){0,4}(?:${STREET_SUFFIX})\b\.?`,
  "gi",
);

/**
 * A postal code, but only where the page says it is one.
 *
 * Five bare digits are a price, a year, a quantity and a part number. The
 * context words are what make it an address — "Shipping to 94122" on a search
 * page is the user's own location, printed by the site for them alone.
 */
const CONTEXTUAL_POSTAL_PATTERN =
  /((?:zip|postal\s*code|ship(?:ping|s|ped)?\s*to|deliver(?:y|ed)?\s*to|located\s*in|(?:mi|miles|km)\s*from)\W{0,12})(\d{5}(?:-\d{4})?)\b/gi;

/**
 * The name a page greets the signed-in user by.
 *
 * Names cannot be found in prose in general, and trying would ruin the text.
 * A greeting is the exception: "Hi John!" is not a sentence about a person, it
 * is the site telling us whose session this is — which is exactly the fact that
 * must not travel. eBay's header prints it on every page.
 */
const GREETING_PATTERN =
  /\b([Hh]i|[Hh]ello|[Hh]ey|[Ww]elcome\s+back|[Ss]igned\s+in\s+as|[Ll]ogged\s+in\s+as|[Gg]ood\s+(?:morning|afternoon|evening))([,!]?\s+)([A-Z][a-z]{1,20})\b/g;

/** A payment card, verified by Luhn. */
export function isLuhnValid(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * An IBAN, verified mod-97.
 *
 * The four leading characters move to the end, letters become numbers, and the
 * whole thing modulo 97 must be 1. A string that satisfies that is an IBAN; the
 * odds of a product code doing so by accident are one in ninety-seven.
 */
export function looksLikeIban(value: string): boolean {
  const compact = value.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(compact)) return false;

  const rearranged = compact.slice(4) + compact.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const digits = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of digits) remainder = (remainder * 10 + (d.charCodeAt(0) - 48)) % 97;
  }
  return remainder === 1;
}

/**
 * A US bank routing number, verified by its ABA check digit.
 *
 * Nine digits alone say nothing. This weighting is what a bank uses to reject a
 * mistyped number, and it rejects roughly nine in ten arbitrary sequences.
 */
export function looksLikeRoutingNumber(value: string): boolean {
  const d = value.replace(/[\s-]/g, "");
  if (!/^\d{9}$/.test(d)) return false;
  const n = [...d].map(c => c.charCodeAt(0) - 48);
  const sum =
    3 * (n[0]! + n[3]! + n[6]!) + 7 * (n[1]! + n[4]! + n[7]!) + (n[2]! + n[5]! + n[8]!);
  return sum % 10 === 0 && sum > 0;
}

/** Whether a single value is personal on its own evidence. */
export function isSensitiveValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isLuhnValid(trimmed.replace(/[ -]/g, ""))) return true;
  if (looksLikeIban(trimmed)) return true;
  if (looksLikeRoutingNumber(trimmed)) return true;
  SSN_PATTERN.lastIndex = 0;
  return SSN_PATTERN.test(trimmed);
}

/**
 * Free text with every recognised personal value replaced.
 *
 * Ordered so the most specific rules run first: a card number inside an address
 * line should be removed as a card, not left behind by a street rule that
 * matched around it.
 */
export function redactSensitiveText(text: string, placeholder: string): string {
  return text
    .replace(/\b\d(?:[ -]?\d){12,18}\b/g, m => (isLuhnValid(m.replace(/[ -]/g, "")) ? placeholder : m))
    .replace(IBAN_CANDIDATE, m => (looksLikeIban(m) ? placeholder : m))
    .replace(SSN_PATTERN, placeholder)
    .replace(ROUTING_CANDIDATE, m => (looksLikeRoutingNumber(m) ? placeholder : m))
    .replace(PHONE_PATTERN, placeholder)
    .replace(STREET_PATTERN, placeholder)
    // The context word is kept and only the value replaced: "Shipping to
    // [redacted]" still tells a reader what the page was doing there.
    .replace(CONTEXTUAL_POSTAL_PATTERN, (_m, lead: string) => `${lead}${placeholder}`)
    .replace(GREETING_PATTERN, (_m, greet: string, gap: string) => `${greet}${gap}${placeholder}`);
}

/** What a removed value becomes. A string, so an inferred shape is unchanged. */
export const REDACTED = "[redacted]";

/** An email anywhere in free text. */
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * Free text with every recognisable personal value removed.
 *
 * The one entry point both sides use: page markdown on its way to the shared
 * graph, and a user's retained request on its way to the database.
 */
export function redactPersonalText(text: string): string;
export function redactPersonalText(text: string | undefined): string | undefined;
export function redactPersonalText(text: string | undefined): string | undefined {
  if (!text) return text;
  return redactSensitiveText(text.replace(EMAIL_PATTERN, REDACTED), REDACTED);
}
