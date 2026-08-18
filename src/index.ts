// @sudobility/sider_types — shared domain types for Sider.
//
// Three tiers, one hard rule: a plaintext secret exists in exactly ONE of them.
//   - GLOBAL  (registry.ts): shared across all users; placeholders only.
//   - PRIVATE (runtime.ts):  per-user server data; uploaded already tokenized.
//   - LOCAL   (local.ts):    browser only; the sole holder of real secret values.

export * from "./common";
export * from "./registry";
export * from "./runtime";
export * from "./local";
export * from "./api";
export * from "./actions";
export * from "./templating";
export * from "./personal-data";
export * from "./recipe-hash";
export * from "./observe";
