import { buildMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Privacy Policy | Talkin Flag",
  description:
    "How Talkin Flag collects, sources, and handles data — including athlete profile data compiled from public sources — and how to correct or remove your profile.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="bg-brand-black min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="mb-14">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-4">
            Privacy
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white leading-none mb-6">
            Privacy Policy
          </h1>
          <p className="text-brand-white/40 text-xs uppercase tracking-widest">
            Last updated: July 18, 2026
          </p>
          <p className="text-brand-white/60 text-lg leading-relaxed max-w-xl mt-6">
            Talkin Flag is a flag football media and rankings platform. This page explains what
            data we collect, where athlete profile data comes from, and — most importantly — how you
            can correct or remove your profile.
          </p>
        </div>

        {/* TODO(governance): data-controller location pending business formation decision —
            Ambra's draft says Italy/Florence; likely Texas LLC per Daniel 2026-07-18.
            Update BOTH privacy (controller) and terms (governing law) together when decided. */}

        {/* Section: What we collect */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            What Data We Collect
          </h2>
          <ul className="space-y-4 text-brand-white/70 text-sm leading-relaxed">
            <li>
              <span className="text-brand-white font-display uppercase tracking-widest text-[11px] block mb-1">
                Account &amp; authentication
              </span>
              When you create an account or sign in — including through Google — we receive and store
              your email address, and a display name if you provide one. We use this to authenticate
              you and to send account-related messages.
            </li>
            <li>
              <span className="text-brand-white font-display uppercase tracking-widest text-[11px] block mb-1">
                Submitted profiles &amp; content
              </span>
              If you submit an athlete profile, claim a profile, submit an event, or post content, we
              store what you send us so we can display it on the site.
            </li>
            <li>
              <span className="text-brand-white font-display uppercase tracking-widest text-[11px] block mb-1">
                Contact &amp; newsletter signups
              </span>
              If you contact us or subscribe to our newsletter, we store your email address and your
              message so we can respond and, where you asked, send updates.
            </li>
            <li>
              <span className="text-brand-white font-display uppercase tracking-widest text-[11px] block mb-1">
                Athlete profile data
              </span>
              We publish profiles and rankings for flag football athletes. Some of this data is
              compiled from public sources rather than provided directly by the athlete — see the next
              section for exactly where it comes from.
            </li>
            <li>
              <span className="text-brand-white font-display uppercase tracking-widest text-[11px] block mb-1">
                Technical &amp; usage data
              </span>
              We may collect your IP address, browser type, device information, pages visited, and
              cookies and analytics data. This helps us operate and improve the site.
            </li>
          </ul>
        </section>

        {/* Section: Sources — GDPR Art. 14 notice */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Where Athlete Profile Data Comes From
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-4">
            Some athlete profiles on Talkin Flag were not submitted by the athlete. They were compiled
            from publicly available sources so that flag football — a sport with almost no mainstream
            statistical coverage — has a usable public record. Those sources are:
          </p>
          <ul className="space-y-3 text-brand-white/70 text-sm leading-relaxed mb-4">
            <li className="border-l-2 border-brand-yellow/30 pl-4">
              <span className="text-brand-white">Public team rosters</span> — published rosters from
              leagues, tournaments, and clubs.
            </li>
            <li className="border-l-2 border-brand-yellow/30 pl-4">
              <span className="text-brand-white">National federation sites</span> — official
              federation and governing-body publications (e.g. USA Football, IFAF, and national
              federations).
            </li>
            <li className="border-l-2 border-brand-yellow/30 pl-4">
              <span className="text-brand-white">flagsonly.com</span> — a public flag football player
              index. Profiles sourced this way are tagged with their source and marked
              &ldquo;unclaimed&rdquo; until an athlete verifies them.
            </li>
          </ul>
          <p className="text-brand-white/50 text-xs leading-relaxed">
            This section is the source disclosure required when personal data is not obtained directly
            from the individual. The categories of data we hold are those described above — name,
            athletic performance statistics, team and competition affiliation, and similar
            sport-related information.
          </p>
        </section>

        {/* Section: Lawful basis */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Our Lawful Basis
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            We process athlete profile data on the basis of our legitimate interest in sports
            reporting and statistics — compiling and publishing information about public athletic
            performance in flag football. We limit what we hold to sport-related information relevant
            to that purpose. For account, contact, and newsletter data, we process it to provide the
            service you asked for and, for newsletters, with your consent.
          </p>
        </section>

        {/* Section: Retention */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Data Retention
          </h2>
          <ul className="space-y-3 text-brand-white/70 text-sm leading-relaxed mb-4">
            <li className="border-l-2 border-brand-yellow/30 pl-4">
              <span className="text-brand-white">Account data</span> — kept as long as your account
              exists.
            </li>
            <li className="border-l-2 border-brand-yellow/30 pl-4">
              <span className="text-brand-white">Athlete profile data</span> — kept as long as it
              remains relevant to the public sporting record, unless you request removal.
            </li>
            <li className="border-l-2 border-brand-yellow/30 pl-4">
              <span className="text-brand-white">Contact &amp; newsletter data</span> — kept until you
              unsubscribe or ask us to delete it.
            </li>
            <li className="border-l-2 border-brand-yellow/30 pl-4">
              <span className="text-brand-white">Technical logs &amp; analytics</span> — kept according
              to provider settings (typically 12–24 months).
            </li>
          </ul>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            When you ask us to remove data, we act on the request as described below.
          </p>
        </section>

        {/* Section: GDPR rights */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Your Rights (GDPR)
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-3">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 text-brand-white/70 text-sm leading-relaxed">
            <li>access the data we hold about you</li>
            <li>correct inaccurate data</li>
            <li>request deletion (&ldquo;right to be forgotten&rdquo;)</li>
            <li>restrict processing</li>
            <li>object to processing</li>
            <li>request data portability</li>
            <li>withdraw consent at any time</li>
            <li>
              lodge a complaint with the <span className="text-brand-white">Garante per la Protezione
              dei Dati Personali</span> (Italian Data Protection Authority) or your local data
              protection authority
            </li>
          </ul>
        </section>

        {/* Section: Correct or remove — the key section */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            How to Correct or Remove Your Profile
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed mb-6">
            If your profile is inaccurate, or you want it corrected or removed, you have two simple
            ways to reach us — and we will act on your request:
          </p>
          <div className="space-y-4">
            <div className="border border-brand-yellow/20 bg-[#111111] p-5">
              <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-2">
                Report an issue on your profile
              </p>
              <p className="text-brand-white/60 text-sm leading-relaxed">
                Every profile has a <span className="text-brand-white">Report an issue</span> button.
                Use it to flag an error, request a correction, or ask for removal. It goes straight to
                our team for review.
              </p>
            </div>
            <div className="border border-brand-yellow/20 bg-[#111111] p-5">
              <p className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-2">
                Contact us directly
              </p>
              <p className="text-brand-white/60 text-sm leading-relaxed">
                Email us at{" "}
                <a
                  href="mailto:talkinflagshow@gmail.com"
                  className="text-brand-yellow underline hover:no-underline"
                >
                  talkinflagshow@gmail.com
                </a>{" "}
                or use our{" "}
                <Link href="/contact" className="text-brand-yellow underline hover:no-underline">
                  contact page
                </Link>
                . Tell us which profile and what you&apos;d like changed or removed.
              </p>
            </div>
          </div>
          <p className="text-brand-white/50 text-xs leading-relaxed mt-6">
            You also have the right to access the data we hold about you, to object to our processing,
            and to have inaccurate data corrected. The two paths above are how you exercise those
            rights with us.
          </p>
        </section>

        {/* Section: Cookies — no cookie banner or standalone Cookie Policy exists yet;
            do not reference either until that owner decision is made. */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Cookies
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            Talkin Flag uses cookies for basic functionality, security, performance, and analytics.
            You can manage cookie preferences through your browser settings.
          </p>
        </section>

        {/* Section: Third-party processors */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Third-Party Processors
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            We use third-party services such as hosting providers, analytics tools, authentication
            providers, and email delivery services. These providers may process data on our behalf
            under GDPR-compliant agreements.
          </p>
        </section>

        {/* Section: International transfers */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            International Transfers
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            If any provider processes data outside the EU, transfers occur under Standard Contractual
            Clauses (SCCs) or EU adequacy decisions.
          </p>
        </section>

        {/* Section: Security */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Data Security
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            We implement reasonable technical and organizational measures to protect your data from
            unauthorized access, loss, or misuse. No online service can guarantee absolute security,
            but we work to safeguard your information.
          </p>
        </section>

        {/* Section: Changes */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Changes to This Policy
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with an updated revision date.
          </p>
        </section>

        {/* Section: Contact */}
        <section>
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Contact Us
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            Questions about this policy or your data? Email{" "}
            <a
              href="mailto:talkinflagshow@gmail.com"
              className="text-brand-yellow underline hover:no-underline"
            >
              talkinflagshow@gmail.com
            </a>{" "}
            or reach us through the{" "}
            <Link href="/contact" className="text-brand-yellow underline hover:no-underline">
              contact page
            </Link>
            .
          </p>
        </section>

      </div>
    </div>
  );
}
