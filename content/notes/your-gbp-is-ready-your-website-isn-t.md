---
title: "Your GBP is ready. Your website isn't."
subtitle: "What do AI agents actually see when they visit your site?"
date: 2026-06-11
slug: your-gbp-is-ready-your-website-isn-t
beehiiv_id: post_fce2439e-c87c-45d5-b658-2e71ec3c8213
source: https://coconotes.beehiiv.com/p/your-gbp-is-ready-your-website-isn-t
kind: essay
topics: [website, ai-visibility, gbp]
---

![Agent Optimization Series hero: a worried man at a laptop while a robot holds a clipboard](https://beehiiv-images-production.s3.amazonaws.com/uploads/asset/file/60263436-71b9-41e9-90ee-aae4e804728b/aos2-2.png?t=1781194263)
<!-- image: hero; Hand-drawn "Agent Optimization Series" header illustration. A worried man sits at a laptop (coffee mug reads "LOCAL SEO") while a robot holding a magnifying glass and a clipboard says "I'm afraid your website is not agent friendly." The clipboard shows "Google Business Profile" checked and "Website" crossed out. -->

Hi!

Last week [I talked about the shift happening in local search](https://www.linkedin.com/pulse/zero-click-rising-so-agent-visits-you-ready-garrett-smith-btmcc/). 

Zero-click gets the headlines, but AI traffic grew 393% last year and converts better than traditional traffic (for now).

The visitors to your website are changing. Not all of them are human.

Here’s what we know…

## **Google published an agent-friendly checklist**

In April, Google's [web.dev](https://web.dev) team posted "Build agent-friendly websites." Seven rules. Specific. Testable.

Most sites fail most of them.

1. Use semantic HTML — real `<button>` and `<a>` tags, not styled divs
2. Stable layouts — nothing shifting while the page loads
3. No invisible overlays blocking clickable stuff
4. Cursor changes to pointer on things you can click
5. Form labels actually connected to their fields
6. Interactive elements big enough to target
7. Proper roles when you're not using native elements

If you've done accessibility work before, you've seen this list. Same rules, new audience.

## **AI agents read the website accessibility tree**

When an agent hits your site, it doesn't see your design. Doesn't care about your brand colors. It reads structure — the accessibility tree. 

Things like buttons, links, form fields, headings. The bare bones that probably bore you in meetings.

UC Berkeley tested this. When they jacked up the accessibility tree, agent success dropped from 78% to 42%. Nearly half of tasks failed because the structure was garbage.

That used to be a screen reader stat nobody cared about until some lawyer sent a demand letter. 

Now it's lost revenue because an agent can’t schedule an appointment or know what number to call.

## **Here’s a simple example of this that’s everywhere**

This is the one that makes it click:

What a person sees:

```
[Book now]
```

Built wrong (what agents read):

```
<div onclick="…">Book now</div>
→ "generic" — no name, agent skips it
```

Built right:

```
<button>Book now</button>
→ button "Book now" — agent can act
```

Looks identical to you and I. Works opposite for our silicon friend. Markup is the only difference and unless you’re looking for it you wouldn’t think twice about it.

Most local business websites are full of this. 

- Contact forms with no labels 
- Divs pretending to be buttons 
- Services buried in paragraphs 

An AI agent shows up, can't figure out what to click, can't fill out the form, and says peace out.

Crazy thing is you never knew you lost the lead!

## **Your GBP is ready. Your website _probably_ isn't.**

Google and I spent years yelling at you to fill out your Business Profile. 

Now its filled with your services. Correct hours. The products you offer. And of course your phone number and booking links. All of it structured to form an entity.

Of course this data was meant for human users of the Maps app and search. 

But as it turns out it's also what agents read.

Your GBP is agent-ready by accident. Your website might be the gap.

And at a time when getting organic traffic is harder than ever you’ll want to close it.

## **I built a tool to check your agent readiness**

I wanted a fast way to see where a site stands. For my clients, for prospects, for anyone curious.

Not just a PDF checklist either.

So I built one.

**[amiagentready.com](https://amiagentready.com)**

Plug in your domain. Get a 0-100 score in about 30 seconds.

It checks five things:

1. **Accessibility tree** — Are your buttons actually buttons? 
2. **Forms & HTML** — Labels connected, fields structured, real submit buttons 
3. **Schema** — Services, hours, FAQ in a format agents can parse 
4. **Booking & pricing** — Real scheduling, not "call us" 
5. **Agent discovery** — llms.txt, crawler rules, the stuff that's coming next

You get a score, a comparison to similar sites, and a fix list you can hand off.

Free. 30 seconds. No email required.

## **What's coming**

Next few weeks I'll break down each piece the audit covers:

- **Next Week:** Forms, labels, semantic HTML — the actual fixes 
- **Week 3:** WebMCP — the protocol nobody's talking about yet 
- **Week 4:** Local business implementation — full checklist

But you don't have to wait. Go see where you stand.

**[amiagentready.com](https://amiagentready.com)**

Talk soon, Garrett

**P.S.** — If you want the whole breakdown now instead of waiting for me to drip it out, there's a full guide on the site: [amiagentready.com/is-your-site-ready-for-ai-agents](https://amiagentready.com/is-your-site-ready-for-ai-agents)
