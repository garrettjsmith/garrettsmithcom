// Send the weekly check-in emails. Run it on a schedule (Railway cron, Mondays):
//   npm run checkin
// Preview without sending or changing anything:
//   npm run checkin -- --dry-run --only sam@company.com
// Re-send this week's for one member:
//   npm run checkin -- --force --only sam@company.com
import { runCheckins } from "../lib/checkin.ts";

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : undefined;
const results = await runCheckins({ dryRun: args.includes("--dry-run"), force: args.includes("--force"), only });
for (const r of results) console.log(`${r.status.padEnd(7)} ${r.key}${r.detail ? `  (${r.detail})` : ""}`);
const failed = results.filter((r) => r.status === "failed").length;
console.log(`${results.length} briefs, ${results.filter((r) => r.status === "sent").length} sent, ${failed} failed`);
process.exit(failed ? 1 : 0);
