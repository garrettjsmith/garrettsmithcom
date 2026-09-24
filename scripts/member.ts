// Give someone access to Ask Garrett by email (or take it away).
// Needs the production Redis credentials in the environment:
//   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npm run member -- add sam@company.com [solo|teams]
//   npm run member -- remove sam@company.com
//   npm run member -- show sam@company.com
import { addMember, getMember, removeMember } from "../lib/members.ts";

const [cmd, email, plan] = process.argv.slice(2);
if (!["add", "remove", "show"].includes(cmd) || !email) {
  console.error("usage: npm run member -- add|remove|show someone@company.com [solo|teams]");
  process.exit(1);
}
if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
  console.error("Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_*) to the production store first.");
  process.exit(1);
}
if (cmd === "add") console.log(await addMember(email, plan === "teams" ? "teams" : "solo"));
else if (cmd === "remove") {
  await removeMember(email);
  console.log(`removed ${email}`);
} else console.log((await getMember(email)) ?? "not a member");
