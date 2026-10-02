---
title: "Zero-click is rising. So are agent visits. Are you ready?"
subtitle: "Agents aren't just finding websites. They want to take action."
date: 2026-06-01
slug: zero-click-is-rising-so-are-agent-visits-are-you-ready
beehiiv_id: post_ff879f9c-7a06-4294-a4ce-90d3479a8641
source: https://coconotes.beehiiv.com/p/zero-click-is-rising-so-are-agent-visits-are-you-ready
kind: essay
topics: [website, ai-visibility, local-search]
---

![Agent Optimization Series](https://beehiiv-images-production.s3.amazonaws.com/uploads/asset/file/022d4a5a-1afa-4617-8bb0-33f462bae73e/Agent_Optimization_Series_Start.png?t=1780334961)
<!-- image: hero; Pen-and-ink style cartoon headed "AGENT OPTIMIZATION SERIES". Garrett in an "SEO" helmet and hoodie, with a "Local SEO" mug and a laptop marked "LSS", looks startled at a friendly robot whose speech bubble says "I don't need to browse. I just need to book." The robot points at a laptop checklist "COMPLETE TASK: Find, Evaluate, Confirm, Book" (all checked); a book on the desk reads "ACTIONS > IMPRESSIONS". Signed "G. SMITH". -->

Howdy —

You've probably seen the zero-click headlines.

Only 41.5% of Google searches send traffic to the open web now. AI Overviews answer questions directly. People get what they need without clicking.

Oh no!

If you're in local SEO, this feels like a generational squeeze. Less organic spots. More competition for what's left.

But there's another number that should be getting more attention:

**AI-referred traffic grew 393% year-over-year in Q1 2026.**

And here's the weird part — it converts 42% better than traditional traffic. Twelve months ago, it converted 38% worse. That's an 80-point swing in one year.

## **Something changed**

A site we launched recently got 90+ sign-ups in a month.

No search traffic. No email blasts. No word of mouth (we didn’t tell anyone).

How is that possible? The visitors have changed.

Not all of them are human anymore. _Agents are here_.

But are your optimized for them?

## **Your site has a new type of visitor**

That's not my phrase. That's Google's.

They [published official guidance](https://web.dev/articles/ai-agent-site-ux) in April titled "Build agent-friendly websites."

AI agents — Claude, ChatGPT, Gemini, Copilot — are browsing sites on behalf of users. Not just to answer their questions. Actually visiting pages to completing tasks.

When someone tells an AI _"book me a plumber for Tuesday who can fix a burst pipe,"_ that agent needs to:

1. **Find businesses that offer that service**
2. **Check availability for the service**
3. **Compare pricing across available providers**
4. _**Actually complete the booking with provider**_

The agent does this by visiting websites. Hopefully, your website.

But most websites are, in Google's words, "functionally broken" for these visitors.

Agents, it turns out, are having a hard time using most websites.

## **The accessibility connection**

Here's what most people don't realize:

Agents navigate your site using the accessibility tree — the same semantic layer screen readers use.

When a [UC Berkeley study tested Claude](https://arxiv.org/html/2602.09310) on 60 everyday web tasks, success dropped from 78% to 42% when the accessibility tree was degraded.

Nearly half of all agent tasks fail because the site doesn't communicate what's clickable, what forms are for, or how to complete actions.

The same labeled buttons, semantic HTML, and structured forms that help screen reader users are exactly what agents need.

70% of websites still fail basic accessibility standards. Which means 70% of websites are functionally broken for AI agents.

## **What agents actually need**

Google's guidance is surprisingly specific. Seven rules:

1. Use semantic HTML — real `<button>` and `<a>` tags, not styled divs
2. Stable layouts — no shifting elements
3. No ghost overlays hiding interactive elements
4. Cursor pointer on clickable things
5. Labels explicitly connected to form fields
6. Interactive elements large enough to target
7. Proper roles when not using semantic elements

If you've ever done accessibility work, this list looks familiar. It's the same list.

If you haven’t don’t worry. Most of this work is standard practice anyone building or managing websites in 2026.

It might be time for an audit and refresh if you haven’t touched your site in some time.

## **The agent infrastructure is here**

This isn't theoretical. [Chrome 146 shipped an early preview of WebMCP](https://developer.chrome.com/blog/webmcp-epp) — a protocol that lets sites expose structured actions directly to agents.

Instead of an agent guessing that a blue rectangle is a submit button, your site declares: "Here's a tool called `book_appointment`. It takes service, date, and time. Call it like this."

The agent doesn't scrape. It calls the function. 90% more efficient.

Chrome 149 announced an origin trial at I/O in May. Edge added support. The W3C is incubating the standard.

The web is becoming more agent-native every day.

## **What this means for local businesses**

For local businesses, there's good news and bad news.

**The good news:** Your GBP is already structured data. Services, hours, products, booking links — Google's been training you to structure this for years. That's agent-readable by default. If you’re keeping it accurate, compliant, and optimized, you have a leg up on those who are not.

**The bad news:** Most local business websites are poorly constructed with walls of paragraphs and clunky contact forms. An agent can [find you through your GBP](https://gmbgorilla.com/google-my-business-optimization-service). But when it hits your website to complete a booking? It’s probably going to have a tough time and might look elsewhere…

Which is probably the competitor with structured service pages, real scheduling tools, and properly labeled forms.

Or the third party platform you are paying per lead to use.

## **What I'm going to cover**

Over the next few weeks, I'm going deep on this:

**Week 1: The Agent-Ready Audit** What Google actually published. The accessibility tree connection. How to see what agents see when they visit your site.

**Week 2: Forms, Labels, and Semantic HTML** The practical fixes. Why your contact form is agent-hostile. The invisible difference between a button that works and one that doesn't.

**Week 3: WebMCP and the Structured Web** The emerging protocol. What it does. Whether you should care yet. Where this is going.

**Week 4: Local Business Implementation** How all of this applies specifically to local. The GBP advantage. The website gap. The checklist.

## **Be ready for both futures**

Zero-click gets the headlines. But the sites losing to zero-click were already losing — they were built for a web that's been disappearing.

The sites winning right now are the ones that work for both humans and agents. Structured. Accessible. Machine-readable.

The question isn't about humans no longer clicking. The question is whether your site is ready for the ones that aren't.

More next week.

Talk soon, Garrett

**P.S.** — Quick test: Open Chrome DevTools on your site. Go to Elements → Accessibility tab. That's your accessibility tree. That's what agents see. If it's a mess, so is your agent experience.
