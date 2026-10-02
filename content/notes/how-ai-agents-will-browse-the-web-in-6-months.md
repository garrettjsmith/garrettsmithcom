---
title: "How AI agents will browse the web in 6 months"
subtitle: "The protocol nobody's talking about yet"
date: 2026-06-29
slug: how-ai-agents-will-browse-the-web-in-6-months
beehiiv_id: post_8b2ea578-2fae-4081-b5cb-2933af8953a2
source: https://coconotes.beehiiv.com/p/how-ai-agents-will-browse-the-web-in-6-months
kind: essay
topics: [website, ai-visibility]
description: "WebMCP could let AI agents call your site's functions directly, and why the basics you fix today still matter."
ask: "Is my website's forms and HTML ready for AI agents today?"
---

Two weeks in. You've **[checked your agent readiness score](https://amiagentready.com/)**. You've audited your forms and buttons. Maybe you've even fixed a few things.

This week is different. Less "fix this now," more "here's where this is going."

I'll keep it short. But you should know this is coming. I think it’s big.

## **How agents browse the web today**

Right now, AI agents browse your site like tourists reading a menu in a foreign language.

They take screenshots. They guess what buttons do based on how they look. They parse your HTML and hope nothing shifts while they're clicking. They reverse-engineer your site's structure pixel by pixel.

Billion-parameter models pretending to be humans. Clicking around like it's 1999.

It works. Mostly. But it's slow, brittle, and burns through compute. One study found this approach uses 90% more tokens than it needs to.

This will matter more in a world where tokens are no longer subsidized by investors.

## **How agents will browse the web tomorrow**

Chrome 146 shipped something called **[WebMCP](https://developer.chrome.com/docs/ai/webmcp)** earlier this year. Chrome 149 opened an origin trial at Google I/O in May. Edge added support. The W3C is incubating the standard.

The short version: WebMCP lets your site tell agents exactly what they can do — and how to do it.

Instead of an agent guessing that a blue rectangle might be a submit button:

Old way:

```
→ Screenshot page
→ Vision model identifies form fields
→ Guess what each field is for
→ Fill in values
→ Find submit button
→ Click coordinates
→ Hope it worked
```

New way **[with MCP](https://localseodata.com/glossary/mcp)**:

```
→ Site exposes book_appointment tool
→ Agent calls book_appointment({ service: "furnace repair", date: "2026-06-15", time: "2pm" })
→ Done
```

The agent doesn't scrape. It calls a function. Like an API, but for agents.

## **Two flavors of WebMCP**

WebMCP has two approaches:

**Declarative:** Your existing forms get exposed as structured tools automatically. If your form is built right — proper labels, semantic HTML, all the stuff from last week — the browser can translate it into something agents can call directly.

**Imperative:** For complex stuff. Multi-step workflows, dynamic interactions, things that need JavaScript. You define the tools explicitly.

The declarative part is why the [Week 1 ](https://www.linkedin.com/pulse/zero-click-rising-so-agent-visits-you-ready-garrett-smith-btmcc/)and [Week 2 fixes](https://www.linkedin.com/pulse/your-contact-form-broken-garrett-smith-ar6jc/) matter beyond today. You're not just making your site work for current agents. You're building the foundation for WebMCP to expose your forms automatically.

## **Should you implement this now?**

Probably not.

Here's where it stands:

- Chrome Canary: Available behind a flag
- Chrome 149: Origin trial (developers testing)
- Edge: Support added
- Safari, Firefox: Nothing announced
- Standardization: W3C community group, not formal spec yet

It's early. Experimental. Chrome-only for practical purposes.

If you're an agency with developer resources and want to get ahead, you can play with it. The Chrome Early Preview Program has documentation and demos.

For most local businesses? Not yet. The semantic HTML and form fixes from the last two weeks are the priority. Those work today and set you up for WebMCP when it goes mainstream.

## **Why I'm telling you anyway**

Because the direction is clear.

Google isn't building this for fun. They published agent-friendly guidance in April. They shipped WebMCP previews in February. They announced origin trials in May. This is a roadmap, not a suggestion.

The web is becoming agent-native. The infrastructure is shipping. The businesses that get ready now — even just the basics — will have a head start when agents go from "interesting experiment" to "how people book plumbers."

## **The timeline I'm watching:**

- Late 2026: Formal browser announcements expected (Google Cloud Next, I/O)
- 2027: Broader adoption if the origin trials go well
- Eventually: Agents calling your site's functions directly instead of cosplaying as humans

## **The bottom line for you and your business**

You don't need to implement WebMCP today.

You do need to:

1. Fix your semantic HTML (**[Week 2](https://www.linkedin.com/pulse/your-contact-form-broken-garrett-smith-ar6jc/)**)
2. Structure your forms properly (**[Week 2](https://www.linkedin.com/pulse/your-contact-form-broken-garrett-smith-ar6jc/)**)
3. Know this is coming (this week)

The sites built right today will work with WebMCP automatically tomorrow. The sites built wrong will need to rebuild.

Next week: bringing it all home. The local business checklist. GBP vs. website. Everything in one place.

Talk soon, Garrett

**P.S.** — If you want to see WebMCP in action, search "Chrome WebMCP early preview" and watch some of the demo videos. It's early, but it's real. This is how agents will browse in a couple years.
