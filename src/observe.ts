// The page-observation seam between sider_extension and sider_api.
//
// Deliberately absent: CSS selectors and page body prose. Selectors are
// regenerated per render and are useless to another user of the site; body prose
// is the current user's own data (order history, addresses) and the graph it
// would land in is shared with every other user of that site. Neither is omitted
// by a filter — neither exists in these types.

export type SnapshotActionKind = "navigate" | "submit" | "input" | "select" | "click";

/** A control's SHAPE. The graph hashes `tag|role|name|actionKind` into view identity. */
export interface SnapshotControl {
  tag: string;
  role?: string;
  /** Accessible name, e.g. "Add to Cart". Plans reference controls by this. */
  name?: string;
  actionKind?: SnapshotActionKind;
}

/**
 * A region of the page. Nesting matters: a region whose content-bearing children
 * are all leaves sharing one shape collapses to a single repeat token, which is
 * what stops a product list from changing the view's identity every time its
 * contents change.
 */
export interface SnapshotRegion {
  key: string;
  role?: string;
  controls?: SnapshotControl[];
  children?: SnapshotRegion[];
}

export interface SnapshotLink {
  toUrlPath: string;
  label?: string;
}

export interface PageSnapshot {
  /** Path with query VALUES dropped and keys kept: /search?q={q} */
  urlPath: string;
  title?: string;
  regions: SnapshotRegion[];
  links: SnapshotLink[];
  /** Structural text only — headings, control names, link labels, item titles. */
  contentMd?: string;
  /** How the agent arrived here, when known. */
  trigger?: { kind: string; label?: string } | null;
}

/** POST /api/v1/observe body. */
export interface ObserveBody {
  /** Assistant thread id — correlates the snapshot with its run. */
  threadId: string;
  siteOrigin: string;
  snapshot: PageSnapshot;
}
