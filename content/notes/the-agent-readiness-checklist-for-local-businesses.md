---
title: "The Agent Readiness Checklist for Local Businesses"
subtitle: "Here's an overview of what exactly to fix on your website."
date: 2026-07-06
slug: the-agent-readiness-checklist-for-local-businesses
beehiiv_id: post_be5ead0f-0917-4878-9187-8ec222814f6b
source: https://coconotes.beehiiv.com/p/the-agent-readiness-checklist-for-local-businesses
kind: essay
topics: [website, ai-visibility, local-search]
description: "A checklist of what to fix on your website so AI agents can read, book and choose your local business."
ask: "How agent-ready is my website compared to my competitors'?"
---

Three weeks in. Time to bring it home.

You've seen the score ([amiagentready.com](https://amiagentready.com)). You've learned why your forms and buttons might be invisible to agents. Now here's the full checklist.

There's more coming down the road (Chrome is shipping protocols that will make this even more important), but that's future stuff. This is what to do now.

## **The current gap**

Your GBP is agent-ready. Google spent years pushing you to structure that data — services, hours, products, booking links. That structure is what agents read.

Your website is probably the opposite. Paragraphs. Contact forms with unlabeled fields. "Call us" for booking. Services described in prose instead of structured data.

Agents find you through your GBP. Then they hit your website to complete the task — book an appointment, check availability, compare you to the competition.

If your site can't handle that, they bounce. The competitor whose site works gets the lead.

## **The agent readiness checklist**

Print this out. Hand it to your developer. Or run your site through [amiagentready.com](https://amiagentready.com) and get the same thing with a score attached.

**Forms & Buttons**

- Every form field has a `<label>` with a `for` attribute connecting it to the input
- Every button is a `<button>`, not a styled div
- Required fields have the `required` attribute
- Error messages are in the HTML, not just visual styling
- The form itself has a clear purpose (heading or aria-label)

**Structure & Semantics**

- Headings use proper hierarchy (h1 → h2 → h3, no skipping)
- Links are `<a>` tags, not divs with click handlers
- Landmarks exist (header, nav, main, footer)
- Interactive elements have `cursor: pointer` in CSS
- Nothing shifts around while the page loads

**Schema & Structured Data**

- LocalBusiness schema with accurate name, address, phone
- Service schema for each service you offer
- OpeningHoursSpecification for availability
- FAQ schema for common questions
- AggregateRating pulling from your reviews

**Booking & Pricing**

- Real scheduling tool (not "call us," not a contact form that goes to an inbox)
- Pricing visible in some form — "starting at $X" or "free estimates"
- Service selection in the booking flow, not just a generic form
- Available times exposed (Calendly, ServiceTitan, Housecall Pro, whatever)

**Agent Discovery**

- llms.txt file at your domain root (summary of your business for AI)
- Robots.txt not blocking AI crawlers
- Schema validates in Google's Rich Results Test

**The quick test.**

Two things you can do in 30 seconds:

1. **Disable CSS on your homepage.** Can you still tell what's clickable and what each form field is for? If not, neither can agents.
2. **Run your site through [amiagentready.com](https://amiagentready.com).** Get a score, see where you stand, get a fix list.

## **What to prioritize?**

If you can't do everything, do this first:

1. Fix your contact/booking form (labels, real buttons)
2. Add a real scheduling tool if you don't have one
3. Add LocalBusiness and Service schema

Those three things cover most of the gap for most local businesses.

## **The business case**

40% of appointments are booked after hours. Businesses with online booking capture 3x more appointments than phone-only. AI traffic converts 42% better than traditional traffic now.

The visitors are changing. The sites that work for non-human visitors will get more of the business. The sites that don't will lose to competitors who bothered.

This isn't about chasing a trend. It's about not leaving money on the table.

**The links.**

→ Check your score: [amiagentready.com](https://amiagentready.com)  
→ Full guide: [amiagentready.com/is-your-site-ready-for-ai-agents](https://amiagentready.com/is-your-site-ready-for-ai-agents)  
→ Schema guide: [amiagentready.com/guides/local-business-schema-for-ai-agents](https://amiagentready.com/guides/local-business-schema-for-ai-agents)  
→ Forms guide: [amiagentready.com/guides/labeling-forms-for-ai-agents](https://amiagentready.com/guides/labeling-forms-for-ai-agents)

That's the series. Four weeks, one new type of visitor, one checklist.

Go fix your site.

Back to the future,  
Garrett

**P.S.** — If you want us to handle this, [get in touch](/#access). We're doing agent readiness implementations for local businesses now — audit, fixes, and ongoing monitoring. But honestly, most of this your current developer can knock out in a day or two with the checklist above.
