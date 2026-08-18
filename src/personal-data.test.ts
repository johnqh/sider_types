import { test, expect } from "bun:test";
import {
  isLuhnValid,
  isSensitiveValue,
  looksLikeIban,
  looksLikeRoutingNumber,
  redactPersonalText,
  redactSensitiveText,
} from "./personal-data";

const R = "[redacted]";
const redact = (text: string) => redactSensitiveText(text, R);

// --- checksummed: financial -------------------------------------------------

test("an IBAN is recognised by its own check digits", () => {
  expect(looksLikeIban("GB82 WEST 1234 5698 7654 32")).toBe(true);
  expect(looksLikeIban("DE89370400440532013000")).toBe(true);
});

test("a string shaped like an IBAN but failing mod-97 is left alone", () => {
  // The odds of a product code passing by accident are one in ninety-seven,
  // which is what makes the rule safe to run over an entire page.
  expect(looksLikeIban("GB82WEST12345698765433")).toBe(false);
  expect(looksLikeIban("US12ORDERNUMBER1234567")).toBe(false);
});

test("a routing number is recognised by its ABA check digit", () => {
  expect(looksLikeRoutingNumber("021000021")).toBe(true); // JPMorgan Chase
  expect(looksLikeRoutingNumber("011401533")).toBe(true); // Bank of America
});

test("nine digits that are not a routing number survive", () => {
  // Nine digits are an order id far more often than a bank. Redacting them all
  // would empty the corpus while protecting nobody.
  expect(looksLikeRoutingNumber("123456789")).toBe(false);
  expect(looksLikeRoutingNumber("987654321")).toBe(false);
});

test("a card is recognised by Luhn wherever it hides", () => {
  expect(isLuhnValid("4111111111111111")).toBe(true);
  expect(isLuhnValid("4111111111111112")).toBe(false);
});

// --- text: what actually appeared on the page -------------------------------

test("removes the name a site greets the user by", () => {
  // eBay prints this in the header of every page, and the whole page text was
  // being sent as evidence when an action was blocked.
  expect(redact("Hi John! Deals Brand Outlet")).toBe(`Hi ${R}! Deals Brand Outlet`);
  expect(redact("Welcome back, Sarah")).toBe(`Welcome back, ${R}`);
});

test("removes a postal code the page says is a postal code", () => {
  expect(redact("Shipping to 94122")).toBe(`Shipping to ${R}`);
  expect(redact("Zip 10001-1234")).toBe(`Zip ${R}`);
});

test("leaves five bare digits alone", () => {
  // A price, a year, a quantity, a part number. Without the context word there
  // is nothing to say this is anyone's address.
  expect(redact("Only 94122 units sold")).toBe("Only 94122 units sold");
  expect(redact("$12345 or best offer")).toBe("$12345 or best offer");
});

test("removes a street address", () => {
  expect(redact("Ship to 1600 Amphitheatre Parkway")).toContain(R);
  expect(redact("742 Evergreen Terrace")).toBe(R);
});

test("leaves a house number with no street suffix alone", () => {
  // "123 Main" is a heading or half a sentence; the suffix is what makes an
  // address an address without a dictionary of every street name.
  expect(redact("123 Main")).toBe("123 Main");
  expect(redact("2000 watts of power")).toBe("2000 watts of power");
});

test("removes a written phone number but not an order id", () => {
  expect(redact("call (415) 555-1234 now")).toBe(`call ${R} now`);
  expect(redact("+1 415-555-1234")).toBe(R);
  // Ten bare digits: a tracking number as often as a phone.
  expect(redact("Tracking 4155551234")).toBe("Tracking 4155551234");
});

test("removes an SSN only when written as one", () => {
  expect(redact("SSN 123-45-6789")).toBe(`SSN ${R}`);
  // Ranges the SSA never issues, so a lookalike sequence is not a person.
  expect(redact("000-45-6789")).toBe("000-45-6789");
  // Bare nine digits stay: that is an order number as often as a person.
  expect(redact("Order 123456789")).toBe("Order 123456789");
});

test("removes a card number from prose", () => {
  expect(redact("paid with 4111 1111 1111 1111 today")).toBe(`paid with ${R} today`);
});

test("keeps ordinary listing text untouched", () => {
  // The corpus this protects is also the corpus the graph exists to hold.
  const listing =
    "Microsoft Surface Pro 9 13in Touch i7 12th Gen 16GB RAM 256GB SSD Win11H Black " +
    "$520.00 or Best Offer Free delivery Located in United States 99.1% positive (147)";
  expect(redact(listing)).toBe(listing);
});

// --- values -----------------------------------------------------------------

test("judges a single value on its own evidence", () => {
  expect(isSensitiveValue("4111111111111111")).toBe(true);
  expect(isSensitiveValue("GB82 WEST 1234 5698 7654 32")).toBe(true);
  expect(isSensitiveValue("021000021")).toBe(true);
  expect(isSensitiveValue("123-45-6789")).toBe(true);
  expect(isSensitiveValue("Surface Pro 9")).toBe(false);
  expect(isSensitiveValue("")).toBe(false);
});

test("removes a postal code phrased as a distance", () => {
  // The same postcode survived under different wording: eBay prints "Shipping
  // to 94122" in one place and "15 mi from 94122" in another, and protecting
  // only the first phrasing protects nobody.
  expect(redact("Free pickup: 15 mi from 94122")).toBe(`Free pickup: 15 mi from ${R}`);
  // Still not a bare number: "from 12345 reviews" is not an address.
  expect(redact("from 12345 reviews")).toBe("from 12345 reviews");
});

test("redactPersonalText is the one entry point both sides use", () => {
  // The extension redacts what it SENDS; the server redacts what it KEEPS.
  // One recogniser, so the two cannot drift apart.
  expect(redactPersonalText("write to me@example.com")).toBe(`write to ${R}`);
  expect(redactPersonalText("Order this and ship to 1600 Amphitheatre Parkway")).toContain(R);
  expect(redactPersonalText("Find Apple Lisa computer for sale")).toBe("Find Apple Lisa computer for sale");
  expect(redactPersonalText(undefined)).toBeUndefined();
});
