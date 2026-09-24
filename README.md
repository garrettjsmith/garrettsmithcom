# garrettsmith.com: Virtual Garrett

A chat-first landing page where people talk to an AI version of Garrett, then
add him to their team's Slack and keep using him like a coworker.

Virtual Garrett = Garrett's voice and rules (`lib/garrett/persona.ts`)
+ [Local SEO Skills](https://github.com/garrettjsmith/localseoskills) as playbooks
+ [Local SEO Data](https://localseodata.com) for live rankings, profiles, and reviews
+ Claude.

## How it fits together

```
garrettsmith.com chat ──► /api/chat ──────┐
                                          ├──► lib/garrett/brain.ts ──► Claude
Slack @mention / DM ───► /api/slack/events┘        │  ├─ open_playbook   (Local SEO Skills, loaded on demand)
                                                   │  ├─ Local SEO Data  (MCP, allowlisted cheap tools)
                                                   │  └─ save_team_note  (Slack only: remembers the team's business)
                                                   └─ Redis: team notes, Slack installs, rate limits, access requests
```

- **One brain, many channels.** `think()` takes a transcript and returns
  Garrett's reply. Web and Slack each add their own formatting rules. SMS or
  email would be another route that calls the same function.
- **Playbooks load on demand.** The system prompt carries a one-line index of
  the 25 strategy skills. The model calls `open_playbook` to pull the full one
  only when a question needs it. Loading all of them on every message would add
  about 65k tokens.
- **Live data is allowlisted.** Only the cheap Local SEO Data tools are turned on
  (see `LIVE_TOOLS` in `brain.ts`). `local_audit`, `geogrid_scan`, and bulk
  keyword tools are off. Without a token, Garrett answers from experience and
  says so.
- **Team memory.** In Slack, Garrett saves short notes about the team's
  business (locations, competitors, goals) and reads them at the start of every
  conversation.
- **Access is invite-only.** Visitors request access on the site. You get a
  Slack ping, run `npm run invite -- them@company.com`, and send them the link.
  Only a signed, unexpired invite can start the Slack install.

## Cost controls

- Default model is `claude-sonnet-5` at `medium` effort. Change it with
  `GARRETT_MODEL` / `GARRETT_EFFORT`.
- The persona, playbook index, and channel rules form a cached prefix.
- The web chat is a free taste: `WEB_FREE_QUESTIONS` (default 5) per visitor
  over 30 days, then the chat turns into the access form. A failed reply
  doesn't count. There's also a global daily ceiling,
  `WEB_MESSAGES_GLOBAL_PER_DAY` (default 1500).
- At most 6 model rounds per reply, and the prompt allows at most 3 live-data
  calls per turn.

## Run it locally

```bash
cp .env.example .env.local   # at minimum set ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
npm test                     # unit tests
```

Without Redis, the app uses an in-memory store. That's fine for local dev, but
production needs Redis.

## Deploy (Railway)

The app is a plain Next.js Node server, so it runs anywhere that runs
`npm run build` and `npm start`. Railway is the recommended host: it keeps
one long-running server, so streamed chat replies and the Slack, email, and
Stripe background work have no function time limits.

1. In Railway, create a project from this GitHub repo. It detects Node and
   runs `npm run build` then `npm start`; `next start` listens on Railway's
   `PORT` automatically.
2. Create a free Upstash Redis database (upstash.com) and set
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Don't skip this:
   without Redis, members, limits, and memory live in memory and vanish on
   every deploy.
3. Set the rest of `.env.example`, including `SITE_URL=https://garrettsmith.com`
   and long random values for `INVITE_SECRET` and `SESSION_SECRET`.
4. Add garrettsmith.com as a custom domain in Railway and point DNS at it.

Vercel also works (use its Upstash integration, which sets `KV_REST_API_*`).

## Set up billing (Stripe)

Visitors get a few free questions, then pick a plan. Checkout creates the
subscription, the webhook turns it into a member, and members sign in on the
web with an emailed link (no passwords). Canceled or unpaid subscriptions lose
access automatically; past-due keeps access while Stripe retries.

1. In Stripe, create two products with monthly prices: Ask Garrett ($19) and
   Ask Garrett for Teams ($299). Put the price IDs in `STRIPE_PRICE_SOLO` and
   `STRIPE_PRICE_TEAMS`.
2. Set `STRIPE_SECRET_KEY`.
3. Add a webhook endpoint `https://garrettsmith.com/api/billing/webhook` for
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, and `customer.subscription.deleted`.
   Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Turn on the customer portal (Settings → Billing → Customer portal) so
   members can update cards and cancel from the Billing link. Keep
   cancellations set to "at the end of the billing period"; the Terms promise
   access through the paid period.
5. New members get a welcome email (needs Resend set up) with how to email
   Garrett and a web sign-in link; Teams members also get their Slack install
   link.

Use test mode keys first; `stripe listen --forward-to localhost:3000/api/billing/webhook`
works for local testing. Members get `MEMBER_QUESTIONS_PER_MONTH` (default
300) as a fair-use cap. `npm run member -- add` still works for comps.

## Set up email (Ask Garrett's address)

Members email Garrett and get answers back by email, threaded per subject,
with notes about their business remembered between emails. Everyone else
gets one polite pointer to the site per month. Replies only go to senders
whose SPF or DKIM checks out, and never to auto-replies or mailing lists.

The address is `ask@ai.garrettsmith.com`, on its own subdomain so the root
domain stays free for a normal inbox (like hey@garrettsmith.com on Google
Workspace or Fastmail).

1. In Resend, add the domain `ai.garrettsmith.com` (not the root) and add
   the DNS records it shows (SPF and DKIM, for sending).
2. On that domain's page, turn on **Receiving** and add the MX record it
   shows. It goes on the `ai` subdomain, so it never conflicts with the
   root domain's inbox.
3. Under **Webhooks**, add `https://garrettsmith.com/api/email/inbound` with
   the `email.received` event. Copy its signing secret.
4. Set `RESEND_API_KEY` and `RESEND_WEBHOOK_SECRET`. The address itself lives
   in `content/site.ts`; if you change it, it has to be on a domain you've
   verified for receiving in Resend.
5. Approve someone: `npm run member -- add them@company.com` (with the
   production Redis credentials in the environment). `remove` and `show`
   work too (comps and manual members; paying members are added by Stripe).

## Set up the Slack app

1. Go to https://api.slack.com/apps, choose **Create New App**, then **From a
   manifest**, and paste `slack-manifest.yml`.
2. Under **Manage Distribution**, turn on public distribution so other
   workspaces can install it.
3. Copy the Client ID, Client Secret, and Signing Secret into `SLACK_CLIENT_ID`,
   `SLACK_CLIENT_SECRET`, and `SLACK_SIGNING_SECRET`.
4. Optional, for testing in your own workspace: install the app there and set
   `SLACK_BOT_TOKEN`.
5. Approve someone: `SITE_URL=https://garrettsmith.com INVITE_SECRET=... npm run invite -- them@company.com`
   prints an install link that works for 14 days.

## Terms and Privacy

`/terms` and `/privacy` are drafted from how the app actually handles data
(what's stored, for how long, and which providers see it). Before charging
real cards:

- Fill in `content/legal.ts`: the legal entity name and governing state.
- Have a lawyer read both pages. They're a solid draft, not legal advice.
- Update `/privacy` whenever a new provider or data flow is added (for
  example Telnyx or WhatsApp).

## Updating the playbooks

The playbooks live in `content/skills/`, copied from the Local SEO Skills repo.
See `content/skills/README.md` to re-sync after you change the skills.

## Not built yet

- Text-thread (Twilio) and email channels. Each would be a route that builds a
  transcript and calls `think()`, like the Slack route.
- Microsoft Teams.
- Slack bot tokens are stored in Redis as plain text. Encrypt them before this
  scales past a handful of teams.
- An admin view of access requests. For now they're in Redis under
  `access:requests` and in your Slack ping.
