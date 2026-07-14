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
