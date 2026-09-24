import { getStore } from "../store.ts";

// Notes: the short facts Garrett saves about a customer's business (a Slack
// team, or an email member) so the next conversation starts with context.

const MAX_NOTES = 40;
const key = (teamId: string) => `team:${teamId}:notes`;

export async function getTeamNotes(teamId: string): Promise<string[]> {
  // Stored newest first; the prompt reads better oldest first.
  return (await getStore().lrange<string>(key(teamId), MAX_NOTES)).reverse();
}

export async function addTeamNote(teamId: string, note: string): Promise<void> {
  await getStore().lpush(key(teamId), note.trim().slice(0, 300), MAX_NOTES);
}
