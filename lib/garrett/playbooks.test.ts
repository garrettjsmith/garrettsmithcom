import { test } from "node:test";
import assert from "node:assert/strict";
import { PLAYBOOK_INDEX, PLAYBOOK_NAMES, getPlaybook } from "./playbooks.ts";

test("bundles the Local SEO Skills playbooks", () => {
  assert.ok(PLAYBOOK_NAMES.includes("gbp-optimization"));
  assert.ok(PLAYBOOK_NAMES.includes("gbp-suspension-recovery"));
  assert.ok(PLAYBOOK_NAMES.includes("localseodata-tool"));
});

test("index lists every playbook with a short trigger", () => {
  for (const n of PLAYBOOK_NAMES) assert.match(PLAYBOOK_INDEX, new RegExp(`^- ${n}: \\S`, "m"));
  assert.ok(PLAYBOOK_INDEX.length < 12_000, `index is ${PLAYBOOK_INDEX.length} chars`);
});

test("getPlaybook returns the body without frontmatter", () => {
  const body = getPlaybook("gbp-optimization");
  assert.ok(body?.startsWith("# Playbook: gbp-optimization"));
  assert.ok(!body?.includes("\n---\nname:"));
  assert.equal(getPlaybook("nope"), null);
});
