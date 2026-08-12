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
