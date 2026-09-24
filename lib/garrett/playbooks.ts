import { PLAYBOOKS } from "./playbooks.generated.ts";

// Garrett's Local SEO Skills, loaded on demand the way Claude loads skills:
// the index (name + when to use it) sits in the cached system prompt, and the
// full playbook comes in through the open_playbook tool only when a question
// needs it. All 25 in the prompt would be ~65k tokens on every message.

/** "When the user wants X. Also use when..." -> "When the user wants X." */
function whenToUse(description: string): string {
  const cut = description.search(/\s(Also use|Also trigger|Trigger on|For [^.]*?see )/);
  return (cut > 0 ? description.slice(0, cut) : description).trim();
}

export const PLAYBOOK_NAMES = PLAYBOOKS.map((p) => p.name);

export const PLAYBOOK_INDEX = `Playbooks: you have Garrett's Local SEO Skills as playbooks. Before giving specific advice in one of these areas, call open_playbook to load the relevant one (at most 2 per turn) and follow its method rather than improvising. Skip it for small talk or questions you can answer in a sentence. The playbooks were written for an agent with more tools than you have here: ignore steps that need Ahrefs, Semrush, BrightLocal, Local Falcon, Search Console, Analytics, briefs on disk, or scheduled tasks, and recommend those steps to the person instead.

${PLAYBOOKS.map((p) => `- ${p.name}: ${whenToUse(p.description)}`).join("\n")}`;

export function getPlaybook(name: string): string | null {
  const p = PLAYBOOKS.find((p) => p.name === name.trim().toLowerCase());
  return p ? `# Playbook: ${p.name}\n\n${p.body}` : null;
}
