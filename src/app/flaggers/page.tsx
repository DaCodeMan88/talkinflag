import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { FlaggerForm } from "./FlaggerForm";

// Page copy is a DRAFT drawn from the Team Programs paper (10-18). It needs
// Daniel's OK on the words and Ambra's sign-off on the paper before merge.
export const metadata: Metadata = buildMetadata({
  title: "Become a Flagger",
  description: "Cover girls' flag football in your area for Talkin Flag: clips, interviews and recaps, with your name on the story.",
  path: "/flaggers",
});

const DOES = [
  "Film a few short clips at local games",
  "Talk to players and coaches when they agree to it",
  "Write a short recap for talkinflag.com",
  "Post it as an Instagram Collab with Talkin Flag",
];

const GETS = [
  "Your byline, and a portfolio you can show",
  "A Flagger profile and a Talkin Flag credential",
  "Training and a reference",
  "For our most active Flaggers: media passes to events we choose",
];

export default function FlaggersPage() {
  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="font-display text-xs uppercase tracking-widest text-brand-yellow">Talkin Flag media network</span>
          <h1 className="font-display text-5xl md:text-7xl uppercase text-brand-white mt-2 leading-none">Become a Flagger</h1>
          <p className="mt-5 text-brand-white/60 leading-relaxed">
            Every game deserves to be seen. Flaggers are Talkin Flag&apos;s local correspondents for girls&apos; flag football:
            they cover the games in their area and put the players on the record.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-3">What you do</h2>
            <ul className="space-y-2 text-sm text-brand-white/70">{DOES.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div>
            <h2 className="font-display text-xs uppercase tracking-widest text-brand-yellow mb-3">What you get</h2>
            <ul className="space-y-2 text-sm text-brand-white/70">{GETS.map((g) => <li key={g}>{g}</li>)}</ul>
          </div>
        </div>

        <p className="mb-10 text-xs text-brand-white/40 leading-relaxed">
          About two games a month. Unpaid: this is a volunteer and portfolio role. Our first group is adults; a high school track comes later.
          A credential does not replace a school&apos;s or venue&apos;s permission to film.
        </p>

        <FlaggerForm />
      </div>
    </div>
  );
}
