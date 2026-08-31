// A question the agent puts to the user, and what it can be answered WITH.
//
// The seam between sider_api, which works out that something is missing, and
// the extension, which has to make it answerable. Prose alone would leave the
// panel with a sentence and a text box for a question whose answer is one of
// four colours the page is already showing.
//
// The kinds are distinguished because they render differently and because
// getting the distinction wrong is worse than not offering controls at all:
// checkboxes on a single-answer question invite an answer nobody can act on,
// and a one-of list on a multi-answer question silently loses the rest.

/** How the answer is given, which decides how the question renders. */
export type PromptKind =
  /** Yes / No, plus whatever else the question admits — buttons. */
  | "confirm"
  /** Exactly one of these — a list, one selectable. */
  | "choice"
  /** Any number of these — checkboxes, and a button to submit. */
  | "multi";

export interface PromptOption {
  /** What the user reads. */
  label: string;
  /**
   * What is sent back when this is chosen, when that differs from the label.
   *
   * A size renders as "32W x 34L" and answers as the same words; a colour the
   * site calls "Dark Stonewash" needs no translation either. This exists for
   * the case where it does, and defaults to the label everywhere else.
   */
  value?: string;
  /** Why this one, when the agent has a reason worth showing. */
  hint?: string;
}

export interface UserPrompt {
  kind: PromptKind;
  /** The question itself, which is also what a client with no UI would show. */
  question: string;
  options: PromptOption[];
  /**
   * May the user type an answer instead of using the controls?
   *
   * The distinction is whether the options are the WHOLE of what can be
   * answered. A product page listing four colours and six sizes is offering
   * every value that exists — typing "teal" there produces a size the page
   * cannot select, so free text is off. A list of cuisines on a food site is a
   * prompt, not a boundary: the user may well want Ethiopian, so free text
   * stays on.
   *
   * False must therefore be earned by the options being authoritative. Anything
   * suggestive leaves it true.
   */
  freeText: boolean;
}

/** The default answers to a yes/no question, when the agent names none. */
export const CONFIRM_OPTIONS: PromptOption[] = [{ label: "Yes" }, { label: "No" }];

/** What a chosen option sends back. */
export function answerFor(option: PromptOption): string {
  return option.value ?? option.label;
}

/**
 * Is this a prompt the panel can render?
 *
 * Checked rather than asserted, because it is composed by a model and travels
 * through two services. A malformed one renders as its question and a text box,
 * which is the behaviour of every client that does not know about prompts at
 * all — worse than the controls, and much better than a blank panel.
 */
export function isUserPrompt(value: unknown): value is UserPrompt {
  if (!value || typeof value !== "object") return false;
  const prompt = value as Partial<UserPrompt>;
  if (prompt.kind !== "confirm" && prompt.kind !== "choice" && prompt.kind !== "multi") return false;
  if (typeof prompt.question !== "string" || !prompt.question.trim()) return false;
  if (typeof prompt.freeText !== "boolean") return false;
  if (!Array.isArray(prompt.options)) return false;
  return prompt.options.every(
    option =>
      option &&
      typeof option === "object" &&
      typeof (option as PromptOption).label === "string" &&
      (option as PromptOption).label.trim().length > 0,
  );
}

/**
 * A prompt offering nothing to click is just a question.
 *
 * `choice` and `multi` need something to choose FROM; `confirm` supplies its
 * own. Rendering an empty list would show a heading over nothing and no way to
 * answer at all when free text is off.
 */
export function hasAnswerableOptions(prompt: UserPrompt): boolean {
  return prompt.kind === "confirm" ? true : prompt.options.length > 0;
}
