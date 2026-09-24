import { test } from "node:test";
import assert from "node:assert/strict";
import { slackToTranscript } from "./slack-transcript.ts";

test("maps a thread to alternating turns", () => {
  const t = slackToTranscript(
    [
      { user: "U1", text: "<@UBOT> why did we drop?" },
      { user: "UBOT", text: "Which location?" },
      { user: "U1", text: "Buffalo" },
      { user: "U2", text: "and Rochester" },
      { user: "UX", bot_id: "B9", text: "some other bot" },
      { user: "U1", subtype: "channel_join", text: "joined" },
    ],
    "UBOT",
  );
  assert.deepEqual(t, [
    { role: "user", content: "<@U1>: Garrett why did we drop?" },
    { role: "assistant", content: "Which location?" },
    { role: "user", content: "<@U1>: Buffalo\n\n<@U2>: and Rochester" },
  ]);
});

test("drops leading and trailing assistant turns", () => {
  const t = slackToTranscript([{ user: "UBOT", text: "hi" }, { user: "U1", text: "yo" }, { user: "UBOT", text: "hey" }], "UBOT");
  assert.deepEqual(t, [{ role: "user", content: "<@U1>: yo" }]);
});
