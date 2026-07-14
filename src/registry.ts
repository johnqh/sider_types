// ============================================================================
// GLOBAL TIER — the shared registry.
//
// Every type in this file is shared across ALL users of a site. It therefore
// may NEVER contain a plaintext secret. Secrets appear only as placeholder
// references to SecretSlot ids (e.g. "{key}" bound to { kind: "secret", slotId }).
// The plaintext value of a secret lives exclusively in the browser (see
// ./local.ts — TokenMapEntry).
// ============================================================================

import type { HttpMethod, IsoTimestamp, JSONSchema } from "./common";

// ---------------------------------------------------------------------------
// Site
// ---------------------------------------------------------------------------

export interface SitePolicy {
  /** If true, Sider is disabled on this origin (denylist: banking/health/etc.). */
  blocked: boolean;
  /** Whether the assistant may perform write/financial actions on this site. */
  allowMutations: boolean;
  /** Rate cap applied to Sider-issued requests on this origin. */
  maxRequestsPerMinute: number;
}

export interface Site {
  id: string;
  /** Scheme + host (+ port). The trust/same-origin boundary. */
  origin: string;
  name: string;
  policy: SitePolicy;
  toolCount: number;
  trustedToolCount: number;
  contributorCount: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Endpoint templates
// ---------------------------------------------------------------------------

export type EndpointCategory =
  | "read"
  | "write"
  | "auth"
  | "telemetry"
  | "unknown";

export interface FieldSemantics {
  /** JSON path within the request or response (e.g. "data.sections[].price"). */
  jsonPath: string;
  meaning: string;
  type: string;
  /** True if this field is an identifier (candidate for a data-flow edge). */
  isId: boolean;
  /** If this field feeds a param of another endpoint, the target template id. */
  linksToTemplateId?: string;
  isPII: boolean;
  /** If true, this field is represented by a SecretSlot rather than a raw value. */
  isSecret: boolean;
}

/** Which credentials an endpoint requires — described structurally, never by value. */
export interface AuthProfile {
  /** SecretSlot ids that must be resolved at call time. */
  requiredSlotIds: string[];
  /** Header names observed carrying auth (values are never recorded). */
  authHeaderNames: string[];
  /** Whether the endpoint relies on cookies the browser attaches automatically. */
  usesCookies: boolean;
}

export interface EndpointTemplate {
  id: string;
  siteId: string;
  method: HttpMethod;
  /** Path with params extracted: "/api/sections/{sectionId}/seats". */
  pathTemplate: string;
  /** For GraphQL: the operation name (the URL alone is not distinguishing). */
  graphqlOperation?: string;
  description: string;
  category: EndpointCategory;
  requestSchema: JSONSchema;
  responseSchema: JSONSchema;
  requestFields: FieldSemantics[];
  responseFields: FieldSemantics[];
  authProfile: AuthProfile;
  observationCount: number;
  corroboratingUserCount: number;
  confidence: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Secret slots — the shareable DEFINITION of a secret (never its value).
// ---------------------------------------------------------------------------

export type SecretKind =
  | "bearer"
  | "csrf"
  | "api_key"
  | "session"
  | "signature"
  | "pii"
  | "unknown";

export type SecretRole =
  // Browser attaches it automatically (credentials:'include'); the slot exists
  // ONLY so samples get placeholder-ized. No substitution at execution.
  | "auto_cookie"
  // Must be resolved locally and substituted at egress (JS-set headers, CSRF,
  // body fields, query params).
  | "active_inject";

/** WHERE a secret is allowed to be placed — enforced at egress (Gate B). */
export type InjectionLocation =
  | { at: "header"; name: string }
  | { at: "query"; param: string }
  | { at: "body"; jsonPath: string }
  | { at: "cookie"; name: string };

/**
 * WHERE to find the current value of a secret in the user's own session.
 * Carries structural identifiers (cookie NAME, storage KEY, selector) only —
 * never the value itself. Each user's browser resolves its own value.
 */
export type ResolverHint =
  | { from: "cookie"; name: string }
  | { from: "storage"; area: "local" | "session"; key: string }
  | { from: "dom"; selector: string; attr?: string }
  | { from: "response"; endpointTemplateId: string; jsonPath: string };

export interface SecretSlot {
  /** Placeholder id used in recipes and tokenized samples, e.g. "site:<id>:auth_bearer". */
  id: string;
  siteId: string;
  kind: SecretKind;
  role: SecretRole;
  injectionLocation: InjectionLocation;
  /** Same-origin lock (Gate A): a recipe host must equal this origin to use the slot. */
  allowedDestination: string;
  /** Ranked structural hints for locating the current value locally. Never values. */
  resolverHints: ResolverHint[];
  confidence: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  // INVARIANT: there is deliberately NO `value` field, and never will be. A
  // secret's plaintext exists only in the browser tab that already holds the
  // user's own session (see ./local.ts — TokenMapEntry.currentValue).
}

// ---------------------------------------------------------------------------
// Tools (MCP-shaped) + invocation recipes
// ---------------------------------------------------------------------------

export type SafetyClass = "read" | "write" | "financial";
export type ToolStatus = "provisional" | "trusted" | "flagged";

/** Resolves a single `{key}` placeholder used anywhere in a recipe. */
export type ParamBinding =
  | { kind: "literal"; value: string }
  | { kind: "arg"; argName: string } // from the tool inputSchema / the user
  | { kind: "secret"; slotId: string } // resolved LOCALLY at egress
  | { kind: "priorOutput"; stepRef: string; jsonPath: string }; // graph edge, this run

export interface HeaderTemplate {
  name: string;
  /** May contain `{key}` placeholders resolved via InvocationRecipe.bindings. */
  valueTemplate: string;
}

export interface SignatureModel {
  type: "none" | "hmac" | "unknown";
  /** When type !== "none", the endpoint typically cannot be replayed via a
   *  direct call and must be driven through DOM emulation instead. */
  note?: string;
}

/** One sub-call of a composite/paginating tool. */
export interface ComposeStep {
  /** Referenced by later `{ kind: "priorOutput", stepRef }` bindings. */
  ref: string;
  toolId: string;
  argBindings: Record<string, ParamBinding>;
  /** If set, run once per element of the array at this jsonPath in the prior
   *  result (fan-out) — e.g. "for each section, fetch its seats". */
  forEachJsonPath?: string;
}

export interface InvocationRecipe {
  method: HttpMethod;
  /** Path/template relative to the site origin. Placeholders: `{key}`. */
  urlTemplate: string;
  headers: HeaderTemplate[];
  /** JSON body template; string values may contain `{key}` placeholders. */
  bodyTemplate?: unknown;
  credentials: "include";
  /** Resolves every `{key}` used in urlTemplate / headers / bodyTemplate. */
  bindings: Record<string, ParamBinding>;
  signatureModel?: SignatureModel;
  /** For composite/paginating tools: ordered sub-calls that feed later bindings. */
  compose?: ComposeStep[];
}

export interface ToolSpec {
  id: string;
  siteId: string;
  name: string;
  description: string;
  /** Short imperative user-facing label ("Search for a product"); "" = none. */
  capabilityLabel?: string;
  inputSchema: JSONSchema;
  safetyClass: SafetyClass;
  /** false ⇒ signed/HMAC or otherwise non-replayable → DOM emulation only. */
  directCallAvailable: boolean;
  recipe: InvocationRecipe;
  status: ToolStatus;
  version: number;
  observationCount: number;
  /** Distinct users whose learned recipe corroborated this tool (trust gate). */
  corroboratingUserCount: number;
  confidence: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Endpoint graph + UX recipes
// ---------------------------------------------------------------------------

export interface EndpointGraphEdge {
  id: string;
  siteId: string;
  fromTemplateId: string;
  /** Field in the source response that supplies the value. */
  fromJsonPath: string;
  toTemplateId: string;
  /** Param of the target endpoint that the value feeds. */
  toParam: string;
  confidence: number;
}

export interface UXRecipe {
  id: string;
  siteId: string;
  /** Natural-language goal pattern this recipe serves, e.g. "find cheapest seats". */
  goalPattern: string;
  /** Key of a generative-UI component the extension knows how to render. */
  componentKey: string;
  /** How to source the component's data. */
  binding: {
    toolId: string;
    argBindings: Record<string, ParamBinding>;
  };
  status: ToolStatus;
}
