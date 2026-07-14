// ============================================================================
// PRIVATE TIER (per-user server data) + browser-side execution helper types.
//
// Capture data reaches this tier already TOKENIZED — every secret value is a
// placeholder before it ever leaves the browser. Plan/audit records store the
// SHAPE of args and results, never secret values.
// ============================================================================

import type { HttpMethod, IsoTimestamp } from "./common";
import type { SafetyClass } from "./registry";

// ---------------------------------------------------------------------------
// Capture (PRIVATE, tokenized before upload)
// ---------------------------------------------------------------------------

export interface RequestContext {
  /** Page route when the request fired. */
  route: string;
  /** DOM element the user interacted with just before the request, if any. */
  triggerSelector?: string;
  pageTitle?: string;
}

/**
 * A single observed request/response.
 *
 * TOKENIZED: every secret value is already a "{{slot:…}}" placeholder before
 * this object leaves the browser. Auth header values are placeholders or were
 * dropped entirely in the browser's redaction pre-pass.
 */
export interface Observation {
  id: string;
  batchId: string;
  /** Assigned during clustering. */
  endpointTemplateId?: string;
  method: HttpMethod;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  status: number;
  responseBody?: unknown;
  timingMs: number;
  context: RequestContext;
  createdAt: IsoTimestamp;
}

export type CaptureBatchStatus =
  | "buffering"
  | "uploaded"
  | "distilled"
  | "discarded";

export interface CaptureBatch {
  id: string;
  contributorId: string;
  siteId: string;
  status: CaptureBatchStatus;
  observationCount: number;
  createdAt: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Planning / execution (PRIVATE audit)
// ---------------------------------------------------------------------------

export type StepKind = "tool_call" | "dom_action" | "ask_user" | "done";

export type StepStatus =
  | "pending"
  | "awaiting_confirm"
  | "running"
  | "done"
  | "error"
  | "aborted";

export interface PlanStep {
  id: string;
  runId: string;
  index: number;
  kind: StepKind;
  toolId?: string;
  safetyClass?: SafetyClass;
  /** Shape/keys of args only — never secret values. */
  argsShape?: unknown;
  status: StepStatus;
  /** Shape of the result — never secret values. */
  resultShape?: unknown;
  rationale?: string;
  error?: string;
  startedAt?: IsoTimestamp;
  finishedAt?: IsoTimestamp;
}

export type PlanRunStatus =
  | "planning"
  | "awaiting_approval"
  | "running"
  | "completed"
  | "aborted"
  | "error";

export interface PlanRun {
  id: string;
  contributorId: string;
  siteId: string;
  goal: string;
  status: PlanRunStatus;
  createdAt: IsoTimestamp;
  finishedAt?: IsoTimestamp;
}

export interface Contributor {
  firebaseUid: string;
  reputation: number;
  createdAt: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Execution engine (browser-side) helper types
// ---------------------------------------------------------------------------

/**
 * Output of sider_lib compiling a ToolSpec + args, BEFORE detokenization.
 * Placeholders are still present; secrets are substituted only after all three
 * egress gates pass.
 */
export interface CompiledRequest {
  method: HttpMethod;
  url: string; // placeholders still present
  headers: Record<string, string>;
  body?: unknown;
  credentials: "include";
  referencedSlotIds: string[];
  safetyClass: SafetyClass;
}

/** Result of an egress gate check (same-origin / injection-location / safety). */
export type GateOutcome =
  | { ok: true }
  | {
      ok: false;
      gate: "same_origin" | "injection_location" | "safety";
      reason: string;
    };
