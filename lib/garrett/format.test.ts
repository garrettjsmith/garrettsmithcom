import { test } from "node:test";
import assert from "node:assert/strict";
import { renderChatHtml, splitFollowups, toSlackMrkdwn, visiblePartial } from "./format.ts";

test("splitFollowups pulls three questions off the end", () => {
  const r = splitFollowups("Answer here.\n\n[[FOLLOWUPS]] Why? | How? | What now?");
  assert.equal(r.text, "Answer here.");
  assert.deepEqual(r.followups, ["Why?", "How?", "What now?"]);
});

test("splitFollowups with no marker", () => {
  assert.deepEqual(splitFollowups(" hi "), { text: "hi", followups: [] });
});

test("visiblePartial hides the marker and a half-typed one", () => {
  assert.equal(visiblePartial("Answer [[FOLLOWUPS]] a | b"), "Answer ");
  assert.equal(visiblePartial("Answer\n[[FOLL"), "Answer\n");
  assert.equal(visiblePartial("Answer [[not a marker"), "Answer [[not a marker");
});

test("renderChatHtml escapes before formatting", () => {
  const html = renderChatHtml('**bold** <script>alert("x")</script>\n\n- one\n- two');
  assert.equal(html, "<p><strong>bold</strong> &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p><ul><li>one</li><li>two</li></ul>");
});

test("toSlackMrkdwn converts bold, bullets, headers, links", () => {
  assert.equal(
    toSlackMrkdwn("## Fix\n**Do this** first\n- a\n* b\n[docs](https://x.com)"),
    "*Fix*\n*Do this* first\n• a\n• b\n<https://x.com|docs>",
  );
});
