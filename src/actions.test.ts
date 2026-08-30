import { test, expect } from "bun:test";
import { TOOL_NAMES, DOM_ACTION_TYPES, type ToolName, type DomActionType } from "./actions";

// These two arrays are a WIRE CONTRACT. sider_api emits one of these names from
// a ShapeShyft decision endpoint and the extension routes on it; a rename on one
// side with no matching rename on the other is exactly how `presentList` came
// back "unknown tool" turn after turn, with the agent unable to end a run whose
// work was already done. Pinned by value so a rename cannot pass silently.
test("the tool name contract is exactly these eight", () => {
  expect([...TOOL_NAMES].sort()).toEqual([
    "attachFile",
    "callSiderTool",
    "downloadFile",
    "navigateTo",
    "planChecklist",
    "presentList",
    "readPage",
    "siderDomAction",
  ]);
});

test("the dom action contract is exactly these seven", () => {
  expect([...DOM_ACTION_TYPES].sort()).toEqual([
    "click",
    "hold",
    "hover",
    "press",
    "scroll",
    "select",
    "type",
  ]);
});

// Exhaustiveness: a name added to the union but not the array (or the reverse)
// fails to compile here rather than at runtime in a browser.
test("every ToolName is present in TOOL_NAMES", () => {
  const seen: Record<ToolName, true> = {
    readPage: true,
    navigateTo: true,
    siderDomAction: true,
    callSiderTool: true,
    attachFile: true,
    downloadFile: true,
    planChecklist: true,
    presentList: true,
  };
  expect(Object.keys(seen).sort()).toEqual([...TOOL_NAMES].sort());
});

test("every DomActionType is present in DOM_ACTION_TYPES", () => {
  const seen: Record<DomActionType, true> = {
    hover: true,
    click: true,
    type: true,
    select: true,
    press: true,
    scroll: true,
    hold: true,
  };
  expect(Object.keys(seen).sort()).toEqual([...DOM_ACTION_TYPES].sort());
});
