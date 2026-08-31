// Structured results for the three model-facing browser actions (callSiderTool,
// readPage, siderDomAction). One shape so the agent can aggregate outcomes and
// report a status summary (e.g. "added 3/5; 2 pre-order only").

// Closed, mechanism-level category — what Sider's own execution can determine.
// Domain-specific "why" lives in the open `reason`/`detail`, never here.
export type OutcomeCategory =
  | "gate"          // a security gate refused the request
  | "http"          // the request returned a non-2xx status
  | "not_found"     // the tool or DOM target was missing
  | "no_effect"     // the action produced no observable result
  | "precondition"; // a site-level condition blocked it (open-ended; see reason/detail)

export interface ActionOutcome {
  /** ok = did what was asked; blocked = known reportable refusal; failed = unexpected. */
  status: "ok" | "blocked" | "failed";
  /** Closed mechanism vocabulary (branch/color on this). */
  category?: OutcomeCategory;
  /** OPEN, domain-agnostic reason slug: "gate_same_origin", "pre_order",
   *  "already_following", "login_required", … Not an enum. */
  reason?: string;
  /** Human-readable detail / evidence. */
  detail?: string;
  /** Tokenized + size-capped payload on ok (read items / response body). */
  data?: unknown;
}

/** One item extracted from a rendered result collection by readPage. */
export interface ExtractedItem {
  title: string;
  price?: string;
  url?: string;
  /** Availability phrase found near the item ("pre-order", "out of stock"); absent = available. */
  availability?: string;
  imageUrl?: string;
  /** href when present, else a resolved unique selector — used to open/click the item. */
  ref: string;
}

export interface ReadPageResult {
  items: ExtractedItem[];
  count: number;
}

/**
 * Every tool the agent can call, named once.
 *
 * sider_api's decision endpoint produces one of these strings and the extension
 * routes on it. Before this existed the name was retyped in four places — the
 * panel's dispatch, two presentation tables, and the live harness — and nothing
 * made them agree: `presentList` was emitted with no executor and answered
 * "unknown tool" on every turn, so the agent kept retrying a run it had already
 * done the work for.
 */
export const TOOL_NAMES = [
  "readPage",
  "navigateTo",
  "siderDomAction",
  "callSiderTool",
  "attachFile",
  "downloadFile",
  "planChecklist",
  "presentList",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

/** Everything `siderDomAction` can do to a page. */
export const DOM_ACTION_TYPES = [
  "hover",
  "click",
  "type",
  "select",
  "press",
  "scroll",
  "hold",
  "drag",
] as const;

export type DomActionType = (typeof DOM_ACTION_TYPES)[number];

/**
 * One act on a page.
 *
 * `controlName` is the currency: the site graph plans in visible labels, because
 * a selector is regenerated per render and means nothing to another user of the
 * site. `selector` remains for exploration, when no label identifies the target,
 * and may carry a frame prefix (see the extension's `frame-ref.ts`).
 */
export interface DomAction {
  type: DomActionType;
  controlName?: string;
  within?: string;
  selector?: string;
  text?: string;
  /** For `press` — a key name, not a character. */
  key?: string;
  /** For `hold` — how long to hold, in milliseconds. */
  ms?: number;
  /**
   * For `drag` — how far to drag, in pixels from the control's centre.
   *
   * A slider thumb is the common case: a large positive `dx` drags it to the
   * far end of its track, and the actuator clamps to the track rather than
   * dragging into empty page.
   */
  dx?: number;
  dy?: number;
  /**
   * For `drag` — the control to drag FROM, when it is not the target itself.
   *
   * The start is normally the control the action names, which is right for a
   * slider: you grab the thumb. Name it separately when the thing you pick up
   * and the thing you are acting on differ — dragging a row's handle to reorder
   * the row, or picking up a marker that sits inside the control being set.
   */
  fromControlName?: string;
  /**
   * For `drag` — the control to drop ONTO, named the way every other control is.
   *
   * The alternative to `dx`/`dy`, for reordering and drag-and-drop targets where
   * the destination is a thing rather than a distance.
   */
  toControlName?: string;
}

export interface ReadPageArgs {
  /** Free-text steer for extraction ("job listings", "prices"). */
  hint?: string;
}

export interface NavigateToArgs {
  url: string;
}

export interface DownloadFileArgs {
  /** May be relative — the caller resolves it against the driven tab's origin. */
  url: string;
  filename?: string;
}

export interface AttachFileArgs {
  /** Which of the user's attached files to use; absent means all of them. */
  fileNames?: string[];
  /** Which upload field, when a form has more than one. */
  controlName?: string;
}

export interface CallSiderToolArgs {
  toolId: string;
  args?: Record<string, unknown>;
}

export interface PlanChecklistArgs {
  items?: unknown[];
  budget?: string;
}

/**
 * Icons a presented list may use.
 *
 * A closed set, not a free string: the panel maps each key to its own glyph, so
 * the model cannot name an icon that does not exist or reach the DOM through it.
 */
export const PRESENT_LIST_ICONS = [
  "briefcase",
  "document",
  "location",
  "calendar",
  "tag",
  "person",
  "building",
  "cart",
  "star",
  "search",
] as const;

export type PresentListIcon = (typeof PRESENT_LIST_ICONS)[number];

/** One row of a presented list. */
export interface PresentedListItem {
  title: string;
  /** Short scalars shown under the title, e.g. ["Part time", "USF Hilltop Campus"]. */
  meta?: string[];
  /** Absolute URL, or a path resolved against the driven tab's origin. */
  href?: string;
  imageUrl?: string;
}

/**
 * What the agent asks the panel to show.
 *
 * Data only — never markup. The agent decides WHAT matters; the panel decides
 * how it looks.
 */
export interface PresentedListSpec {
  title?: string;
  icon?: PresentListIcon;
  items: PresentedListItem[];
}
