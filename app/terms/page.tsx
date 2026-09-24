import type { Metadata } from "next";
import Link from "next/link";
import { COPY } from "@/content/copy.ts";
import { LEGAL } from "@/content/legal.ts";
import { LegalPage } from "@/components/LegalPage.tsx";

export const metadata: Metadata = { title: "Terms of Service · Ask Garrett" };

export default function Terms() {
  const plans = COPY.pricing.plans.filter((p) => p.id !== "real");
  const cap = process.env.MEMBER_QUESTIONS_PER_MONTH || "300";
  const free = process.env.WEB_FREE_QUESTIONS || "5";
  return (
    <LegalPage title="Terms of Service" effective={LEGAL.effective}>
      <p>
        These terms cover Ask Garrett, the AI local search advisor at garrettsmith.com, including the web chat, email
        (ask@garrettsmith.com), and the Slack app (the &ldquo;Service&rdquo;). The Service is provided by {LEGAL.entity}{" "}
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using it, you agree to these terms. If you use it for a business, you
        agree on that business&rsquo;s behalf.
      </p>

      <h2>1. What Ask Garrett is, and isn&rsquo;t</h2>
      <p>
        Ask Garrett is an AI. It works from Garrett Smith&rsquo;s published playbooks and live search data, but it is not
        Garrett, and Garrett does not review its answers before you see them.
      </p>
      <ul>
        <li>
          Answers are general guidance about local search, not professional, legal, or financial advice. AI can be wrong,
          incomplete, or out of date, and live data can have gaps.
        </li>
        <li>
          Nobody can guarantee rankings, reviews, traffic, leads, or that Google will reinstate a profile. We don&rsquo;t.
        </li>
        <li>
          You decide what to change on your Google Business Profile, website, or anywhere else, and you&rsquo;re
          responsible for those changes. Changes to a business name, address, category, or service area can trigger
          suspension or re-verification; check them before you make them.
        </li>
      </ul>

      <h2>2. Free questions and plans</h2>
      <p>
        Visitors can ask a few questions free ({free} over 30 days per visitor) without signing up. To keep going, you
        choose a plan:
      </p>
      <ul>
        {plans.map((p) => (
          <li key={p.id}>
            <b>{p.label}</b>: {p.price} {p.unit}. {p.body}
          </li>
        ))}
      </ul>
      <p>
        Plans include up to {cap} questions a month per account as fair use. If you need more, email {LEGAL.contact}.
        Features marked &ldquo;coming soon&rdquo; aren&rsquo;t part of your plan until they launch.
      </p>

      <h2>3. Billing, renewal, and cancellation</h2>
      <ul>
        <li>
          Plans are subscriptions billed monthly in advance through Stripe, and they renew automatically until you
          cancel.
        </li>
        <li>
          Cancel any time from <b>Billing</b> on the site (or email {LEGAL.contact}). You keep access until the end of the
          period you&rsquo;ve paid for, and you won&rsquo;t be charged again.
        </li>
        <li>
          Payments are non-refundable, including for partial months, except where the law requires otherwise. If
          something went wrong, email us and we&rsquo;ll look at it.
        </li>
        <li>
          If a payment fails, we may pause or end access after Stripe&rsquo;s retries. We may change prices with at least
          30 days&rsquo; notice by email; the new price applies from your next billing period after that.
        </li>
        <li>Prices don&rsquo;t include taxes, which may be added where required.</li>
      </ul>

      <h2>4. Your account</h2>
      <p>
        Your account is your email address. Sign-in links, the member cookie, and Slack install links are for you (or, on
        Teams, your workspace). Don&rsquo;t share them. You must be at least 18 and able to form a binding contract. Tell
        us right away if you think someone else is using your account.
      </p>

      <h2>5. Acceptable use</h2>
      <p>Don&rsquo;t use the Service to:</p>
      <ul>
        <li>break the law, or Google&rsquo;s or any platform&rsquo;s rules (for example fake listings, fake reviews, or keyword-stuffed names);</li>
        <li>harass anyone, or research someone else&rsquo;s business in order to harm it;</li>
        <li>get around the free-question limit or fair-use cap, resell access, or share one plan across unrelated businesses;</li>
        <li>scrape, overload, reverse engineer, or try to extract the system prompts or playbooks behind the Service;</li>
        <li>send us anything you don&rsquo;t have the right to share, such as passwords or other people&rsquo;s private data.</li>
      </ul>
      <p>We may limit, suspend, or end access for anyone who does.</p>

      <h2>6. Your content</h2>
      <p>
        You own what you send us: questions, emails, Slack messages, and details about your business. You give us
        permission to use it to run the Service for you, including sending it to the providers listed in our{" "}
        <Link href="/privacy">Privacy Policy</Link>. You own the answers you receive and can use them however you like.
        We don&rsquo;t sell your content.
      </p>

      <h2>7. Our content and third-party services</h2>
      <p>
        The Service, its design, and its prompts belong to us. Garrett&rsquo;s Local SEO Skills playbooks are separately
        open source under their own license. The Service relies on third parties, including Anthropic (the AI model),
        Local SEO Data (live search data), Stripe, Resend, and Slack. Their services have their own terms, and search
        results and third-party data are outside our control.
      </p>

      <h2>8. Changes and availability</h2>
      <p>
        We&rsquo;re improving the Service constantly and may change or discontinue features. We don&rsquo;t promise it
        will always be available or error-free. If we shut it down, we&rsquo;ll give at least 30 days&rsquo; notice and
        stop billing.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the fullest extent the law allows,
        we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose,
        accuracy, and non-infringement.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the fullest extent the law allows, we aren&rsquo;t liable for indirect, incidental, special, consequential, or
        punitive damages, or for lost profits, revenue, rankings, or data, or for suspended or lost listings. Our total
        liability for any claim about the Service is limited to the amount you paid us in the three months before the
        claim, or $100 if you haven&rsquo;t paid anything.
      </p>

      <h2>11. Indemnity</h2>
      <p>
        If someone brings a claim against us because of how you used the Service or something you sent us, you&rsquo;ll
        cover our reasonable costs of dealing with it.
      </p>

      <h2>12. Ending these terms</h2>
      <p>
        You can stop using the Service and cancel at any time. We can end your access if you break these terms. Sections
        6 through 11 and 13 survive.
      </p>

      <h2>13. Law and disputes</h2>
      <p>
        These terms are governed by the laws of {LEGAL.state}, without regard to conflict-of-law rules. Disputes go to the
        state or federal courts located in {LEGAL.state}, and you and we consent to their jurisdiction. Before filing
        anything, email {LEGAL.contact} and give us 30 days to try to sort it out.
      </p>

      <h2>14. Changes to these terms</h2>
      <p>
        We may update these terms. If a change is material, we&rsquo;ll email members at least 14 days before it takes
        effect. Continuing to use the Service after that means you accept the new terms.
      </p>

      <h2>15. Contact</h2>
      <p>Questions about these terms: {LEGAL.contact}.</p>
    </LegalPage>
  );
}
