---
title: "Your contact form is broken"
subtitle: "And you don't even know it..."
date: 2026-06-15
slug: your-contact-form-is-broken
beehiiv_id: post_b0ba4dad-fa6a-4cd0-b971-79db5c8fa6cb
source: https://coconotes.beehiiv.com/p/your-contact-form-is-broken
kind: essay
topics: [website, ai-visibility]
---

![Agents and humans are probably seeing too different things when viewing your website.](https://beehiiv-images-production.s3.amazonaws.com/uploads/asset/file/7dc11db5-766f-4ac0-a9ac-2ecbfb334589/aos-3.png?t=1781543456)
<!-- image: hero; Hand-drawn "Agent Optimization Series" header illustration. A worried man at a laptop showing a "Contact Us" form (Name, Email, Phone, Your message, Submit) with purple question marks ("What is this for?", "Phone number?", "Message about what?"). A robot with a magnifying glass says "I can't reliably understand this. Your form isn't agent friendly." Its "Agent Readiness Checklist" clipboard (Semantic Markup, Field Labels, Purpose Clarity, Structured Data, Machine Readable) is all crossed out. -->
*Agents and humans are probably seeing too different things when viewing your website.*

Hey there,

Last week I showed you how to [check your site's agent readiness score](https://amiagentready.com). Hopefully you plugged your domain into [amiagentready.com](https://amiagentready.com) and saw where you stand.

If not join the 100+ who have already gotten their Agent Readiness Score.

This week? Let talk about the most common issues and their fixes.

Most of this isn't complicated. 

It's just never been a priority. The stuff I'm about to cover has been best practice for 20 years. Most just ignored it because the consequences were invisible.

They're not invisible anymore.

## **Agents don't read paragraphs. They parse structure.**

When a human visits your site, they scan visually. Usually in a F pattern.

If a human user sees a box, they know it's a field to fill out or part of form. Humans see words next to the box, they know what to type.

Agents can't do that. 

They read the code underneath. And if the code doesn't explicitly say "this field is for email" or "this button submits the form," the agent has no idea what it's looking at.

It bounces. You lose the lead. You never knew.

Here’s the four biggest problems we see and how to fix them.

## **The label problem**

This looks fine for humans:

```
Email
[_______________]
```

But here's how most developers build it:

```
<span>Email</span>
<input type="email">
```

What an agent sees: a text label floating in space and a text box with no name. The visual proximity tells humans they're connected. Agents don't see visual proximity.

The fix:

```
<label for="email">Email</label>
<input type="email" id="email">
```

The `for` attribute connects the label to the input explicitly. Now the agent knows the field is for email.

That's it. One attribute. Most forms don't have it.

## **The button problem**

I showed this last week, but it's worth repeating because it's everywhere:

Broken:

```
<div class="btn" onclick="submitForm()">Send Message</div>
```

Agent sees: "generic" — no role, no label, nothing to click.

Fixed:

```
<button type="submit">Send Message</button>
```

Agent sees: button "Send Message" — knows exactly what it does.

Same visual result. Opposite agent result.

Go look at your site's contact form right now. Inspect element. Is your submit button a `<button>` or a styled `<div>`? I'd bet money on the div.

## **The structure problem**

Beyond individual elements, agents need to understand the form's purpose.

Bad:

```
<div class="contact-section">
  <span>Get in touch</span>
  <input placeholder="Name">
  <input placeholder="Email">
  <textarea placeholder="Message"></textarea>
  <div class="submit-btn">Send</div>
</div>
```

Agents see: a bunch of unnamed fields and a div. No idea what this form is for. No idea what each field expects. Placeholders disappear when you start typing — they're hints, not labels.

Better:

```
<form aria-label="Contact form">
  <h2>Get in touch</h2>
  <label for="name">Name</label>
  <input id="name" name="name" required>
  
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>
  
  <label for="message">Message</label>
  <textarea id="message" name="message" required></textarea>
  
  <button type="submit">Send</button>
</form>
```

Every field labeled. Submit is a real button. `required` attributes tell agents which fields are mandatory. The `<form>` element itself has a label describing its purpose.

An agent can fill this out. An agent can't fill out the first one.

## **The "call us" problem**

This is the big one for local businesses.

When an agent is trying to complete a task — "book me a plumber for Tuesday" — it needs:

→ What services you offer  
→ When you're available  
→ How to complete the booking

If your answer to "how to book" is:

> Call us at (555) 123-4567 to schedule an appointment!

That's a dead end. Agents can't call.

Same with:

> Fill out the form below and we'll get back to you within 24 hours.

Agents aren't waiting 24 hours. They're completing a task right now.

The competitor with a real scheduling tool — Calendly, ServiceTitan, Housecall Pro, whatever — that exposes available times and lets the agent book directly? They get the appointment.

40% of appointments are booked after business hours. If your booking flow requires a human to answer, you're losing those.

## **The audit you can perform**

Run through your site with agent eyes:

- Every form field has a `<label>` with a `for` attribute
- Every button is a `<button>`, not a styled div
- Required fields have the `required` attribute
- Error messages are in the actual HTML, not just visual red borders
- Forms have purpose described via `aria-label` or heading
- Booking doesn't dead-end at "call us"

Or just run your site through [amiagentready.com](https://amiagentready.com) — it checks all of this automatically.

## **The good news**

None of these fixes are hard. A decent developer can knock them out in a day.

The code changes are small. The impact is big.

You're not rebuilding your site. You're fixing the invisible gaps that cost you leads from visitors you can't see.

Next week: WebMCP — the protocol Chrome is shipping that lets your site talk directly to agents. Less practical than this week, but important to understand where this is going.

Talk soon,  
Garrett

**P.S.** — Quick test: Disable CSS on your homepage. Can you still tell what each form field is for and what's clickable? If not, neither can agents.
