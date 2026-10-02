import { test } from "node:test";
import assert from "node:assert/strict";
import { getNote, getNotes, noteText, parseFrontmatter, renderNote } from "./notes.ts";

test("frontmatter: strings, quotes, and lists", () => {
  const { data, body } = parseFrontmatter('---\ntitle: "A \\"quoted\\" title"\ndate: 2026-03-03\ntopics: [gbp, reviews]\nkind: essay   # comment\n---\nHello');
  assert.equal(data.title, 'A "quoted" title');
  assert.deepEqual(data.topics, ["gbp", "reviews"]);
  assert.equal(data.kind, "essay");
  assert.equal(body, "Hello");
});

test("only essays are published, newest first", () => {
  const notes = getNotes();
  assert.equal(notes.length, 23);
  assert.ok(notes.every((n) => n.kind === "essay"));
  assert.ok(notes.every((n, i) => i === 0 || notes[i - 1].date >= n.date));
  assert.equal(getNote("state-of-the-serps-july-2026"), undefined);
});

test("every essay is ready for the web", () => {
  for (const n of getNotes()) {
    assert.ok(n.description && n.description.length <= 160, `${n.slug} description`);
    assert.ok(n.ask && n.ask.length <= 90, `${n.slug} ask`);
    assert.ok(!/beehiiv-images-production/.test(n.body), `${n.slug} still links a beehiiv image`);
    assert.ok(!/^\s*(hey|hi|hola|howdy)\b/i.test(n.body.trimStart()), `${n.slug} still opens with a greeting`);
  }
});

test("images become framed figures; diagrams render; outside links open in a new tab", () => {
  const html = renderNote(
    "Intro\n\n![A screenshot](/notes/x/a.png)\n<!-- image: screenshot; notes -->\n\n<div data-diagram=\"journey\"></div>\n\nSee [docs](https://example.com) and [us](/#access).",
  );
  assert.match(html, /<figure class="nfig screenshot"><img src="\/notes\/x\/a.png" alt="A screenshot"/);
  assert.match(html, /class="ndiag journey"/);
  assert.match(html, /<a href="https:\/\/example.com" target="_blank" rel="noopener">/);
  assert.match(html, /<a href="\/#access">/);
  assert.doesNotMatch(html, /<!--/);
});

test("vGarrett reads notes as plain text", () => {
  const text = noteText(getNote("your-customer-s-search-started-before-google")!);
  assert.doesNotMatch(text, /data-diagram|<!--|!\[/);
});
