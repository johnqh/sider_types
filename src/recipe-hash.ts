// Recipe canonicalization + corroboration hashing. Pure domain logic shared by
// the backend (trust engine: distinct-recipe-hash quorum) and the frontend. A
// stable sorted-key stringify makes two users' equivalent recipes hash equal.

import type { InvocationRecipe } from "./registry";

/** Stable stringify (sorted keys) so two users' equivalent recipes hash equal. */
export function canonicalizeRecipe(recipe: InvocationRecipe): string {
  return stableStringify(recipe);
}

export function hashRecipe(recipe: InvocationRecipe): string {
  const s = canonicalizeRecipe(recipe);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}
