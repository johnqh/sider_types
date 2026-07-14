// Common primitives shared across all Sider tiers.

/** ISO-8601 timestamp string. */
export type IsoTimestamp = string;

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

/**
 * Minimal JSON Schema representation. Sider stores inferred request/response
 * shapes and tool input schemas as JSON Schema so they are portable to MCP.
 */
export interface JSONSchema {
  type?:
    | "object"
    | "array"
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "null";
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  description?: string;
  format?: string;
  [k: string]: unknown;
}

/** Standard success/error envelope returned by sider_api. */
export type ApiResponse<T> =
  | { success: true; data: T; timestamp: IsoTimestamp }
  | { success: false; error: string; timestamp: IsoTimestamp };
