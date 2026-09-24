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

## Deploy (Vercel)

1. Import the repo into Vercel.
2. Add Upstash Redis from the Vercel Marketplace. Its `KV_REST_API_*` variables
   are picked up automatically.
3. Set the env vars from `.env.example`: `ANTHROPIC_API_KEY`,
   `LOCALSEODATA_MCP_TOKEN`, `INVITE_SECRET` (a long random string),
   `SITE_URL=https://garrettsmith.com`, and optionally
   `ACCESS_NOTIFY_WEBHOOK_URL`.
4. Point garrettsmith.com at the project.

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
