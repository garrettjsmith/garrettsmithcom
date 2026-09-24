import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/content/legal.ts";
import { LegalPage } from "@/components/LegalPage.tsx";
import { ASK_EMAIL } from "@/content/site.ts";

export const metadata: Metadata = { title: "Privacy Policy · Ask Garrett" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" effective={LEGAL.effective}>
      <p>
        This policy explains what Ask Garrett (the web chat at garrettsmith.com, {ASK_EMAIL}, and the Slack app)
        collects, why, who we share it with, and how long we keep it. It&rsquo;s provided by {LEGAL.entity}. The short
        version: we use what you send us to answer you, we don&rsquo;t sell it, and we keep as little as we can.
      </p>

      <h2>What we collect</h2>
      <h3>When you use the web chat</h3>
      <ul>
        <li>
          <b>Your questions and the answers.</b> The conversation is kept in your browser tab (session storage) and sent
          to our server with each new question so the AI has context. We don&rsquo;t store web conversations on our
          servers. Closing the tab clears them.
        </li>
        <li>
          <b>Your IP address</b>, to count free questions and prevent abuse. The counter expires after 30 days.
        </li>
        <li>
          <b>Messages turned away.</b> An automated check screens each message for topic. If it declines one (for
          example, off-topic or trying to get around the rules), we keep that single message, not the conversation, to
          review how the check is working. We keep the most recent 500.
        </li>
      </ul>
      <h3>When you become a member</h3>
      <ul>
        <li>
          <b>Your email address and plan</b>, and the Stripe customer and subscription IDs that link them. Stripe handles
          your card; we never see or store card numbers.
        </li>
        <li>
          <b>Notes about your business</b> that the AI saves so it remembers you: things like business names, locations,
          competitors, and goals (up to 40 short notes). The same notes are used on the web, by email, and in Slack for
          your account.
        </li>
        <li>
          <b>A sign-in cookie</b> (&ldquo;ag_member&rdquo;) that keeps you signed in for up to 60 days. It&rsquo;s the
          only cookie we set, and it&rsquo;s required for the Service to work. We don&rsquo;t use advertising or tracking
          cookies.
        </li>
      </ul>
      <h3>When you email {ASK_EMAIL}</h3>
      <ul>
        <li>
          <b>The email</b>: sender, subject, and message. We keep the last 12 messages of each thread for 60 days so
          replies have context. Attachments aren&rsquo;t read.
        </li>
        <li>
          <b>Email authentication results</b> (SPF, DKIM, DMARC), so we only reply to real senders.
        </li>
        <li>If you aren&rsquo;t a member, we keep your address for 30 days so we only send you one reply.</li>
      </ul>
      <h3>When your team uses the Slack app</h3>
      <ul>
        <li>
          <b>Messages in threads where Garrett is mentioned, and direct messages to Garrett</b>, read at the time to
          answer. We don&rsquo;t store Slack conversations; we store the workspace&rsquo;s saved notes and the Slack
          access token, which is deleted when the app is uninstalled.
        </li>
        <li>Slack user IDs, so the AI can tell teammates apart within a thread.</li>
      </ul>
      <h3>When you use the contact form</h3>
      <ul>
        <li>Your email, topic, and note, so Garrett can reply. We keep the most recent 1,000 requests.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To answer your questions, including looking up live search data about the businesses you ask about.</li>
        <li>To run your account: billing, sign-in, the free-question limit, and fair use.</li>
        <li>To send emails you&rsquo;d expect: answers, sign-in links, receipts, and important account notices.</li>
        <li>To keep the Service secure and fix problems.</li>
      </ul>
      <p>
        We don&rsquo;t sell or rent personal information, don&rsquo;t use it for advertising, and don&rsquo;t use your
        conversations to train AI models.
      </p>

      <h2>Who we share it with</h2>
      <p>Only the providers that run the Service, and only what each one needs:</p>
      <ul>
        <li>
          <b>Anthropic</b> (the AI model): your questions, conversation context, and saved notes, to generate answers.
          Anthropic&rsquo;s commercial terms don&rsquo;t allow it to train its models on this data.
        </li>
        <li>
          <b>Local SEO Data</b> (a related service Garrett operates): the business names, keywords, locations, and URLs
          being looked up.
        </li>
        <li>
          <b>Stripe</b> (payments): your email and payment details.
        </li>
        <li>
          <b>Resend</b> (email): emails to and from {ASK_EMAIL}.
        </li>
        <li>
          <b>Upstash</b> (database) and <b>Railway</b> (hosting): where the data described above is stored and processed.
        </li>
        <li>
          <b>Slack</b>, if your team installs the app.
        </li>
      </ul>
      <p>
        We may also share information if the law requires it, to protect someone&rsquo;s safety, or as part of a sale or
        merger of the business (in which case this policy would still apply to your data).
      </p>
      <p>
        These providers may process data in the United States and other countries. Where required, we rely on their
        standard contractual protections for international transfers.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Web conversations: only in your browser tab.</li>
        <li>Email threads: 60 days after the last message.</li>
        <li>Free-question and rate-limit counters: 30 days.</li>
        <li>Messages turned away by the topic check: the most recent 500, then deleted.</li>
        <li>Saved business notes: until you ask us to delete them.</li>
        <li>Account and billing records: while you&rsquo;re a member, and afterwards as long as needed for taxes, disputes, and the law.</li>
        <li>Server logs from our hosting provider: kept briefly for debugging, under the provider&rsquo;s retention.</li>
      </ul>

      <h2>Your choices and rights</h2>
      <p>
        You can ask us to show you, correct, export, or delete your personal information, including your saved notes, by
        emailing {LEGAL.contact} from the address on your account. We&rsquo;ll respond within 30 days. Depending on where
        you live (for example California, the EU, or the UK), you may have additional rights, including the right to
        complain to a data protection authority. We won&rsquo;t treat you differently for using them.
      </p>

      <h2>Security</h2>
      <p>
        Connections are encrypted, webhooks from Stripe, Resend, and Slack are signature-checked, sign-in uses expiring
        signed links, and access to production data is limited to the people who run the Service. No system is perfectly secure; if a breach
        affects your data, we&rsquo;ll tell you as the law requires.
      </p>

      <h2>Children</h2>
      <p>The Service is for businesses and isn&rsquo;t directed at anyone under 18. We don&rsquo;t knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy in a way that matters, we&rsquo;ll email members before it takes effect and update the
        date above. See also our <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>Contact</h2>
      <p>Privacy questions or requests: {LEGAL.contact}.</p>
    </LegalPage>
  );
}
