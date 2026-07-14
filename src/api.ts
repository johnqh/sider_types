// Wire contract for sider_api — the request/response DTOs shared by the server
// (to type its handlers) and sider_client (to type its calls). Keeping these
// here is the single source of truth that stops the two sides from drifting.

import type {
  EndpointGraphEdge,
  SafetyClass,
  SecretSlot,
  Site,
  ToolSpec,
  UXRecipe,
} from "./registry";
import type { Observation, StepKind } from "./runtime";

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
