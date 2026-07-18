import { buildMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Terms of Service | Talkin Flag",
  description:
    "The terms that govern use of Talkin Flag — user submissions, accuracy of statistics, rankings as editorial opinion, no-warranty, and account eligibility.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="bg-brand-black min-h-screen pt-28 pb-24 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="mb-14">
          <p className="text-brand-yellow font-display text-[10px] uppercase tracking-[0.4em] mb-4">
            Terms
          </p>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white leading-none mb-6">
            Terms of Service
          </h1>
          <p className="text-brand-white/40 text-xs uppercase tracking-widest">
            Last updated: July 18, 2026
          </p>
          <p className="text-brand-white/60 text-lg leading-relaxed max-w-xl mt-6">
            By using Talkin Flag you agree to these terms. They cover what you can submit, how our
            statistics and rankings work, and the limits of what we can promise.
          </p>
        </div>

        {/* Section: User submissions */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Your Submissions
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            When you submit content to Talkin Flag — a profile, an event, an update, a message, or any
            other material — you grant Talkin Flag a non-exclusive, worldwide, royalty-free license to
            host, display, reproduce, and distribute that content on and in connection with the
            service. You keep ownership of what you submit. You confirm that you have the right to
            submit it and that it does not infringe anyone else&apos;s rights.
          </p>
        </section>

        {/* Section: Third-party content */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Third-Party Content
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            Talkin Flag displays information, images, logos, and data sourced from public team
            rosters, federations and governing bodies, tournaments and leagues, and publicly
            available media. All such third-party content remains the property of its respective
            owners. Talkin Flag does not claim ownership and uses it for reporting, commentary, and
            statistical purposes. Users may not reuse or redistribute third-party content without
            permission from the owner.
          </p>
        </section>

        {/* Section: Accuracy */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Accuracy of Statistics
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            Player statistics on Talkin Flag are compiled from public sources and user submissions.
            We work to keep them accurate, but we cannot guarantee that every stat is complete or
            error-free. If you spot an error, please report it using the{" "}
            <span className="text-brand-white">Report an issue</span> tool on the relevant profile, or
            reach us via the{" "}
            <Link href="/contact" className="text-brand-yellow underline hover:no-underline">
              contact page
            </Link>
            . See our{" "}
            <Link href="/privacy" className="text-brand-yellow underline hover:no-underline">
              Privacy Policy
            </Link>{" "}
            for how we source and handle profile data.
          </p>
        </section>

        {/* Section: Rankings are editorial opinion */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Rankings Are Editorial Opinion
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            TF Rank, Flag IQ scores, and all other rankings and ratings on Talkin Flag are editorial
            opinion. They are produced by a disclosed, methodology-driven system — not statements of
            objective fact — and reflect our and our community&apos;s assessment of athletic
            performance. The full methodology is published at{" "}
            <Link
              href="/how-rankings-work"
              className="text-brand-yellow underline hover:no-underline"
            >
              How Rankings Work
            </Link>
            . Reasonable people can disagree about rankings, and they may change over time as data and
            inputs change.
          </p>
        </section>

        {/* Section: No warranty */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            No Warranty
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            Talkin Flag is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
            warranties of any kind, whether express or implied, including fitness for a particular
            purpose and non-infringement. We do not warrant that the service will be uninterrupted,
            secure, or error-free.
          </p>
          <p className="text-brand-white/70 text-sm leading-relaxed mt-4 mb-3">
            To the fullest extent permitted by law, Talkin Flag is not liable for:
          </p>
          <ul className="list-disc list-inside space-y-1 text-brand-white/70 text-sm leading-relaxed">
            <li>indirect or consequential damages</li>
            <li>inaccuracies or omissions</li>
            <li>downtime or service interruptions</li>
            <li>data loss</li>
            <li>issues caused by third-party links or external services</li>
          </ul>
          <p className="text-brand-white/70 text-sm leading-relaxed mt-4">
            Use of the service is at your own risk.
          </p>
        </section>

        {/* Section: Service availability */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Service Availability
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            We may modify, update, suspend, or discontinue any part of the service at any time
            without notice.
          </p>
        </section>

        {/* Section: Eligibility / COPPA */}
        <section className="mb-14">
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Account Eligibility
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            You must be at least 14 years old to create an account on Talkin Flag. By creating an
            account you confirm that you meet this requirement. If we learn that we have collected
            account information from someone under 14, we will delete it.
          </p>
        </section>

        {/* TODO(governance): jurisdiction pending business formation decision —
            Ambra's draft says Italy/Florence; likely Texas LLC per Daniel 2026-07-18.
            Update BOTH terms (governing law) and privacy (controller) together when decided. */}

        {/* Section: Changes / contact */}
        <section>
          <h2 className="font-display text-2xl uppercase text-brand-yellow mb-6 tracking-widest">
            Changes &amp; Contact
          </h2>
          <p className="text-brand-white/70 text-sm leading-relaxed">
            We may update these terms from time to time; the &ldquo;last updated&rdquo; date above
            reflects the latest version. Questions? Email{" "}
            <a
              href="mailto:talkinflagshow@gmail.com"
              className="text-brand-yellow underline hover:no-underline"
            >
              talkinflagshow@gmail.com
            </a>{" "}
            or use the{" "}
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
