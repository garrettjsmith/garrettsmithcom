import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPatch, applyReminder, findBusiness, renderBrief, takeDueReminders } from "./brief.ts";

test("update_brief creates a business, then patches only what's passed", () => {
  let { brief } = applyPatch(null, "email:sam@x.com", { business: "Jon the Plumber", city: "Buffalo, NY", keywords: ["plumber", "drain cleaning"] });
  ({ brief } = applyPatch(brief, "email:sam@x.com", {
    business: "jon the plumber",
    findings: { critical: ["12 reviews vs 451 for the #1"] },
    next_action: "Send review request texts after every job",
    log: "Ran a local visibility audit",
  }));
  assert.equal(brief.businesses.length, 1);
  const b = brief.businesses[0];
  assert.equal(b.city, "Buffalo, NY");
  assert.deepEqual(b.keywords, ["plumber", "drain cleaning"]);
  assert.deepEqual(b.findings.critical, ["12 reviews vs 451 for the #1"]);
  assert.equal(b.log[0].text, "Ran a local visibility audit");
  assert.equal(brief.checkins, true);
});

test("a single business is found without a name; several need one", () => {
  let { brief } = applyPatch(null, "k", { business: "A Plumbing" });
  assert.equal(findBusiness(brief, undefined)?.name, "A Plumbing");
  ({ brief } = applyPatch(brief, "k", { business: "B Roofing" }));
  assert.equal(findBusiness(brief, undefined), undefined);
  assert.equal(findBusiness(brief, "b roofing")?.name, "B Roofing");
});

test("reminders come due and roll forward by their cadence", () => {
  const { brief } = applyPatch(null, "k", { business: "A Plumbing" });
  applyReminder(brief, { business: "A Plumbing", text: "Add 3 new job photos to the profile", every: "2 weeks" });
  const biz = brief.businesses[0];
  const due = takeDueReminders(biz, "2026-09-28");
  assert.equal(due.length, 1);
  assert.equal(biz.reminders[0].due, "2026-10-12");
  assert.equal(takeDueReminders(biz, "2026-10-05").length, 0);
  applyReminder(brief, { business: "A Plumbing", text: "Add 3 new job photos to the profile", remove: true });
  assert.equal(biz.reminders.length, 0);
});

test("the rendered brief flags what's missing", () => {
  const { brief } = applyPatch(null, "k", { business: "A Plumbing", city: "Erie, PA" });
  const text = renderBrief(brief, true);
  assert.match(text, /## A Plumbing/);
  assert.match(text, /Missing: target keywords, website/);
  assert.match(text, /Weekly check-in emails: on/);
  assert.match(renderBrief(null, true), /Brief: empty/);
});
