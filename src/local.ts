// ============================================================================
// LOCAL TIER — browser only.
//
// Nothing in this file is EVER uploaded to sider_api, written to a server
// database, or placed in an LLM prompt. It lives in chrome.storage.session
// (per-tab, cleared on close) and in memory.
// ============================================================================

import type { IsoTimestamp } from "./common";
import type { ResolverHint } from "./registry";

/**
 * Maps a global SecretSlot to how its value is found in THIS user's session,
 * and (transiently) to the value itself.
 *
 * `currentValue` is the ONLY field in the entire Sider type system that may
 * hold a plaintext secret. It exists only in the tab that already legitimately
 * holds the user's own credential, is read fresh at egress, and is never
 * persisted to disk or transmitted anywhere.
 */
export interface TokenMapEntry {
  /** Matches a global SecretSlot.id. */
  slotId: string;
  /** The hint that actually resolved a value in this session. */
  resolver: ResolverHint;
  /** Read fresh at egress; never persisted or transmitted. */
  currentValue?: string;
  lastSeenAt: IsoTimestamp;
}
