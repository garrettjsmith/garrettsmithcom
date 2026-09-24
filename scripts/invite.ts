// Make a Slack install link for someone you've approved.
//   INVITE_SECRET=... SITE_URL=https://garrettsmith.com npm run invite -- someone@company.com [days]
import { createInvite } from "../lib/invite.ts";

const [email, days] = process.argv.slice(2);
if (!email) {
  console.error("usage: npm run invite -- someone@company.com [days]");
  process.exit(1);
}
const site = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
console.log(`${site}/api/slack/install?invite=${createInvite(email, Number(days) || 14)}`);
