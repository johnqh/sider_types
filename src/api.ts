// Wire contract for sider_api — the request/response DTOs shared by the server
// (to type its handlers) and sider_client (to type its calls). Keeping these
// here is the single source of truth that stops the two sides from drifting.

import type { IsoTimestamp, JSONSchema } from "./common";
import type {
  EndpointGraphEdge,
  InvocationRecipe,
  SafetyClass,
  SecretSlot,
  Site,
  ToolSpec,
  ToolStatus,
  UXRecipe,
} from "./registry";
import type { CaptureBatch, Contributor, Observation, StepKind } from "./runtime";

/** A planner decision (mirror of the ShapeShyft plan-next-step output). */
export interface PlannerStep {
  kind: StepKind;
  toolId?: string;
  args?: Record<string, unknown>;
  safetyClass?: SafetyClass;
  rationale?: string;
  domAction?: { type: "hover" | "click" | "type"; selector: string; text?: string };
  askPrompt?: string;
}

export interface SiteLookupResult {
  known: boolean;
  site?: Site;
  hasTrustedTools?: boolean;
}

/** The MCP tool catalog served for a site (placeholder-only, safe to share). */
export interface ToolCatalog {
  tools: ToolSpec[];
  secretSlots: SecretSlot[];
  edges: EndpointGraphEdge[];
  uxRecipes: UXRecipe[];
}

export type ObservationUpload = Omit<Observation, "id" | "batchId" | "createdAt">;
export type SecretSlotUpload = Omit<SecretSlot, "siteId" | "createdAt" | "updatedAt">;

export interface CaptureRequest {
  siteOrigin: string;
  siteName?: string;
  observations: ObservationUpload[];
  secretSlots?: SecretSlotUpload[];
}
export interface CaptureResponse {
  batchId: string;
  siteId: string;
}

export interface PlanStartResponse {
  runId: string;
  step: PlannerStep;
}
export interface PlanStepResponse {
  step: PlannerStep;
}

/** Public aggregate stats for the marketing site. */
export interface StatsResponse {
  siteCount: number;
  toolCount: number;
  trustedToolCount: number;
  contributorCount: number;
}

// ---------------------------------------------------------------------------
// Dashboard DTOs (per-user + registry inspection). Spec 2026-07-20 §3.
// ---------------------------------------------------------------------------

/** GET /api/v1/me — the signed-in contributor + aggregate counts. */
export interface MeResponse {
  contributor: Contributor;
  batchCount: number;
  observationCount: number;
  /** Tools this user has corroborated (cast a recipe vote on). */
  toolsContributed: number;
  /** Of those, how many are currently `trusted`. */
  trustedToolsContributed: number;
}

/** One row of GET /api/v1/me/capture-batches. */
export interface MyCaptureBatchSummary extends CaptureBatch {
  siteOrigin: string;
  siteName: string;
}

/** GET /api/v1/me/capture-batches/:id — a batch plus its observations. */
export interface MyCaptureBatchDetail {
  batch: MyCaptureBatchSummary;
  observations: Observation[];
}

/** One row of GET /api/v1/me/tools — a tool this user corroborated. */
export interface MyToolEntry {
  toolId: string;
  siteId: string;
  name: string;
  status: ToolStatus;
  safetyClass: SafetyClass;
  version: number;
  corroboratingUserCount: number;
  /** Hash of MY independently-derived recipe. */
  myRecipeHash: string;
  /** Hash of the recipe currently stored on the tool. */
  currentRecipeHash: string;
  /** Whether my vote agrees with the stored recipe. */
  agreesWithCurrent: boolean;
  votedAt: IsoTimestamp;
}

/** GET /api/v1/tools/:id — full tool detail for the registry inspector. */
export interface ToolDetailResponse {
  /** The tools table row (recipe, schema, safety, status, counts). */
  tool: {
    id: string;
    siteId: string;
    name: string;
    description: string;
    capabilityLabel: string;
    inputSchema: JSONSchema;
    safetyClass: SafetyClass;
    directCallAvailable: boolean;
    recipe: InvocationRecipe;
    status: ToolStatus;
    version: number;
    observationCount: number;
    corroboratingUserCount: number;
    confidence: number;
    createdAt: IsoTimestamp;
    updatedAt: IsoTimestamp;
  };
  /** Anonymized corroboration breakdown: recipe hash → distinct-user count. */
  corroboration: {
    distinctUsers: number;
    hashCounts: Record<string, number>;
    trustThreshold: number;
  };
}
