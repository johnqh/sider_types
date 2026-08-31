import { test, expect } from "bun:test";
import { answerFor, hasAnswerableOptions, isUserPrompt, type UserPrompt } from "./prompting";

const choice: UserPrompt = {
  kind: "choice",
  question: "Which colour?",
  options: [{ label: "Dark Stonewash" }, { label: "Black" }],
  freeText: false,
};

test("a well-formed prompt is recognised", () => {
  expect(isUserPrompt(choice)).toBe(true);
});

// Composed by a model and carried through two services. A malformed one renders
// as its question and a text box — what a client that knows nothing about
// prompts would do — rather than blanking the panel.
test("anything malformed is refused rather than rendered", () => {
  expect(isUserPrompt(null)).toBe(false);
  expect(isUserPrompt({ ...choice, kind: "dropdown" })).toBe(false);
  expect(isUserPrompt({ ...choice, question: "  " })).toBe(false);
  expect(isUserPrompt({ ...choice, options: "Black" })).toBe(false);
  expect(isUserPrompt({ ...choice, options: [{ value: "x" }] })).toBe(false);
  expect(isUserPrompt({ kind: "choice", question: "Which?", options: [] })).toBe(false);
});

test("an option answers with its label unless it carries a value", () => {
  expect(answerFor({ label: "Black" })).toBe("Black");
  expect(answerFor({ label: "Dark Stonewash", value: "col-4471" })).toBe("col-4471");
});

// A list with nothing in it shows a heading over nothing, and with free text
// off there is no way to answer at all.
test("a choice with no options is not answerable", () => {
  expect(hasAnswerableOptions({ ...choice, options: [] })).toBe(false);
  expect(hasAnswerableOptions(choice)).toBe(true);
});

test("a confirm supplies its own answers, so it is always answerable", () => {
  expect(hasAnswerableOptions({ kind: "confirm", question: "Add it?", options: [], freeText: true })).toBe(
    true,
  );
});
