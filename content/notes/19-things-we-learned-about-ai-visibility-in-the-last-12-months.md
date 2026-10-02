---
title: "19 things we learned about AI visibility in the last 12 months"
subtitle: "The biggest lessons from our own optimization efforts and 30+ audits"
date: 2026-09-16
slug: 19-things-we-learned-about-ai-visibility-in-the-last-12-months
beehiiv_id: post_2cbea21e-fea7-4d2e-b15e-c45bb0ed69dd
source: https://coconotes.beehiiv.com/p/19-things-we-learned-about-ai-visibility-in-the-last-12-months
kind: essay
topics: [ai-visibility, website, local-search]
---

![19 AI visibility lessons learned](https://beehiiv-images-production.s3.amazonaws.com/uploads/asset/file/55d5d805-f728-4849-9b19-aeef0c3b03f8/19_ai_visibility_lessons_learned.jpg?t=1789497325)
<!-- image: hero; Header graphic reading "19 things we learned about AI visibility in the last 12 months" with the tagline "The biggest lessons from our own optimization efforts and 50+ audits." On the right a line-drawn robot labeled "AI" lifts one highlighted five-star profile card from a row of five review/profile cards. Note: the image says "50+ audits" while the post subtitle says "30+ audits". -->

Hi!

We've spent the past year going deep into AI visibility.

Figuring out how to improve it for own software and services through trial and error.

Auditing clients, benchmarking visibility, helping them set strategy, figuring out what works, trying to stop doing what doesn’t.

We’ve been fortunate to see a wide range over the past year. From regional personal injury practices to state hospital systems to national franchises. 

It’s been a lot of fun, and occasionally frustrating.

One thing is for sure. The contexts of each project have been different, but the lessons keep repeating.

Here's what we've actually learned doing the work. Some of this took us months to figure out. 

Hopefully it helps you save a few…

**1. Understand the difference between AI agents and LLMs**

We spent the first few months marrying these. They're not the same thing.

An LLM recommends based on what it learned during training. An agent takes actions, browses live, retrieves information in real time.

Optimizing for each is different. 

Training data is influenced by PR, mentions, brand presence across the web. Retrieval is influenced by whether you can be found, whether you can be accessed, and whether your content is worth citing when the agent gets there. 

Once we started thinking about them differently, separating these in our audits, the recommended actions got a lot more useful.

**2. There are two types of AI optimization**

This took us a while to articulate clearly in comms and reporting:

**Type 1: Getting the LLM to recommend your brand**

This is about brand authority. PR mentions, review content, entity recognition, being a known thing that the model learned about during training.

When someone asks "who's a good plumber in Phoenix," you want to be in the answer. That requires brand authority.

**Type 2: Getting your content used as a source**

This is about content structure and reliability. Being crawlable, being fast, being comprehensive, being the page that gets cited when the engine needs to ground its answer.

If you’re a plumber, when someone asks "how do I fix a leaking faucet," you want your guide to be the source. That requires technical reliability.

We kept mixing these up early on. Now it's the first question we ask: are we trying to get them recommended, or get their content cited? 

Different plays for each.

**3. Different LLMs play by entirely different rules**

We learned this the hard way with a client who was showing up consistently in ChatGPT but was invisible in Gemini. 

The reason?

ChatGPT, Gemini, Perplexity, Claude each has different training data, different retrieval approaches, different logic applied. 

A one-size-fits-all strategy will completely miss the mark on most of them in competitive markets.

**4. Figure out where your customers actually search before you optimize anything**

We used to jump straight into optimization. Now we start every engagement by figuring out where the customers actually are.

A regional personal injury firm might have prospects starting in ChatGPT because they're asking complex questions about their situation before they're ready to call anyone. 

A state hospital system might find their patients still start on Google because healthcare searches skew older and more transactional. 

A national HVAC franchise might see totally different behavior by market: one city heavy on Gemini, another all Google Maps.

The point is: don't assume. Survey customers at intake. Ask how they found you. Look at referral data. Check out the server logs. 

Then focus your effort on the platforms that actually matter for your buyers, not the ones getting the most press coverage.

**5. Your bot protection is probably blocking AI crawlers**

We discovered this when a client's visibility dropped overnight after a Cloudflare update. 

Turns out Cloudflare blocks some AI crawlers by default on new configurations now.

Your WAF, CDN settings, robots.txt, etc. Any of these might be telling AI crawlers to go away. We've seen it dozens of times now. 

And if they can't crawl you, they can't cite you.

**6. Don't block AI training bots**

Especially CCBot.

A model can only recommend brands it already knows from its training data. We had a client who'd blocked all AI training bots for who cares what reasons. 

They were invisible while competitors who hadn't blocked were getting recommended.

Understand the tradeoff if you’re sensitive to this: you're trading future AI visibility for crawler control. 

Make that decision intentionally.

**7. Read your server logs**

This is now standard in our audits. We sit down with the client's dev team and actually look.

A 403 means you blocked the bot. A 499 means it got tired of waiting and gave up. Either way, you're not getting cited.

We've found visibility problems in server logs for everyone from single-location law firms to 200-location retail chains. 

Unsexy work, but it's where a lot of AI visibility actually dies.

**8. Time to first byte matters more than you think**

We figured this out when a client with great content wasn't getting cited. Their site loaded "fine" for humans, but their time-to-first-byte was over 800ms.

No idea what that means? Well, apparently it’s too slow for AI!

AI engines fetch your page live while the user waits. They give up fast. You need to measure TTFB in milliseconds, not as a simple pass/fail. 

We've seen pages get passed over for citations purely because they were too slow.

**9. Server-side rendering is everything**

We had a startup client with a React-based site. Beautiful content. To us mere humans.

Turns out it was completely invisible to AI. Argh.

Why? It was buried in code. Most AI crawlers can't execute JavaScript. Client-side rendered content doesn't exist to them. 

Now we check this on every audit: what does the page look like with JavaScript disabled? 

That's what they see 👀 

**10. One definitive piece beats 50 thin ones**

We had a client with a content strategy built around volume. Fifty 500-word blog posts covering every angle of their services. Good for SEO circa 2018. Useless for AI citations in most cases.

Engines rarely cite two pages from the same domain. When you spread your expertise across 50 shallow posts, they often cannibalize each other. None of them are comprehensive enough to be the answer.

We consolidated their best content into a few definitive guides, the 3,000+ words, genuinely useful, the kind of page you'd bookmark type. Low and behold, citations increased. 

One authoritative piece on a topic beats 50 that just talked a small aspect of the topic.

**11. Recency matters for retrieval**

We noticed older content getting passed over even when it was comprehensive. Engines weight freshness for certain query types.

A guide last updated in 2022 might lose to a thinner piece penned in 2026. 

Not always true, but we see it often enough that we now build content refresh cycles into every engagement (often using AI agents). 

Updating existing pages, even just  adding recent context, has always been a good move and today can help improve your AI visibility.

**12. Optimize for the queries the engines write, not the prompts users type**

This is something most people miss. 

When you ask ChatGPT a question, it often runs searches behind the scenes. It very often shows you the searches it makes.

Those searches, called "fan outs", are actual optimization targets. They're more specific, more structured, and more keyword-like than the conversational prompt the user typed.

We now watch what searches ChatGPT runs for queries in each client's space. 

Based on what we see over time, it becomes a large part of what we optimize for.

**13. Track prompts by persona**

We noticed a client showing up for technical queries but invisible for executive-level ones. Same product, but there were different ways to talk about it.

A CFO and a developer can describe the same thing completely differently. Which means they get different answers often built from different sources. 

Now we map out buyer personas and make sure there's different prompts and content that matches how each one asks.

This is a sneaky good one if you’re selling multiple products and service or working across different geographies.

**14. AI visibility relies on organic strength**

Early on, we had clients who wanted to skip straight to "AI optimization" without fixing basic SEO problems. It doesn't work.

You still need a fast, crawlable site. You still need content that isn't commodity garbage. You still need decent organic rankings. 

AI visibility is a layer on top of that foundation. Without the foundation, the layer has nothing to sit on.

(This goes for your GBP too!)

**15. Double down on digital PR**

We tracked a client's AI visibility before and after a press campaign. Mentions in four industry publications around a quality award (no links, just brand mentions) increased their appearance rate in AI recommendations 31% within 90 days.

This is different from traditional link building. Mentions in trusted publications can feed both the training data and the retrieval system, whether they include a link or not.

Turn your brand into something work talking about. That's the game.

**16. For some verticals, build expert entities, not just brand entities**

In healthcare, legal, and financial services, we've seen AI recommend specific people, not just the organization. "Dr. Smith at XYZ Hospital" rather than just "XYZ Hospital."

If your business depends on individual expertise, those individuals need to be entities too. Named in press coverage. Quoted in publications. Mentioned in reviews. Authoring content under their own byline.

The brand matters. But for some categories, the expert matters more.

**17. If you can't get into the listicle, create it yourself**

We had a client obsessed with getting mentioned in a specific "best of" article that was found to be controlled by a competitor. Wasn't going to happen.

So we built their own comparison page. Seeded assets, roundups and guides you publish yourself, often perform just as well. 

The client's own page now gets cited more than the one they were chasing.

Just be careful. A lot of brands are overdoing it and heavily spamming this tactic can come with negative side effects.

**18. Reddit and forums get scraped heavily.**

These platforms feed training data aggressively. We've seen clients get cited because of a single Reddit thread mentioning them. Or because it now mentions them 🙂 

This isn't a license to spam. But it's worth considering creating an account, joining relevant communities, and participating where you can provide valuable answers.

And if this doesn’t exist, you can create the community yourself or a branded one for your company.

Even if you are not ready to go that far, monitoring what's being said about you on Reddit, Quora, and industry forums, has become increasingly important. 

A genuine recommendation from a real user in a relevant thread can influence AI recommendations for years.

**19. The feedback loop is slower than you're used to**

The hardest thing to explain to clients: the work you do today might not show up for months. Models retrain on their own schedules. The press mention you landed in March might not influence recommendations until a model update in September.

We've seen it over and over. Clients want weekly reports showing AI visibility gains. That's not how this works most of the time.

Set expectations accordingly. Build systems that compound. The businesses that started this work a year ago are now seeing the results. The ones starting today need to understand the payoff is real when done right, it's just not going to happen overnight.

---

**Where to go from here**

We've learned most of this the hard way through audits that revealed problems we didn't expect, experiments that failed before they worked, and clients who pushed us to figure out what actually makes them money.

The next year ahead is going to be much the same. Benchmark, test, review, repeat.

With each new model release comes changes requiring new ways of thinking and doing as AI companies continue to innovate how they approach generating responses.

If you haven’t got started there’s no better time than now. 

Don’t be intimated. We’re all out here trying to figure it out.

Talk soon,  
Garrett

**P.S.** — If you’re trying to get started with AI visibility and feel lost or are stuck somewhere along the journey, feel free to reach out. Always happy to see if we can help! Maybe something we’ll learn ends up in the next email 😉 
