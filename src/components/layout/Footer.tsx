import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const socials = [
  { label: "Instagram", href: "https://instagram.com/talkinflagshow", external: true },
  { label: "YouTube", href: "https://youtube.com/@thetalkinballsnetwork", external: true },
  { label: "Spotify", href: "https://open.spotify.com/search/Talkin%20Flag", external: true },
  { label: "X", href: "https://x.com/TalkinFlagShow", external: true },
];

const watchReadLinks = [
  { label: "Podcast", href: "/podcast" },
  { label: "Media", href: "/media" },
  { label: "Blog", href: "/blog" },
  { label: "RSS Feed", href: "/blog/feed.xml", external: true },
  { label: "Network", href: "https://youtube.com/@thetalkinballsnetwork", external: true },
];

const databaseLinks = [
  { label: "Players", href: "/players" },
  { label: "Teams", href: "/teams" },
  { label: "Rankings", href: "/rankings" },
  { label: "How Rankings Work", href: "/how-rankings-work" },
  { label: "Athlete of the Week", href: "/athletes/featured" },
  { label: "Top 10 Plays", href: "/plays" },
];

const competeLinks = [
  { label: "Evaluate Talent", href: "/evaluate" },
  { label: "Flag IQ Quiz", href: "/iq" },
  { label: "Events", href: "/events" },
  { label: "Results", href: "/results" },
  { label: "Find a League", href: "/find-a-league" },
  { label: "Submit Profile", href: "/players/submit" },
  { label: "Submit Event", href: "/events/submit" },
];

const connectLinks = [
  { label: "About", href: "/about" },
  { label: "Coaches", href: "/coaches" },
  { label: "Scouts", href: "/scouts/apply" },
  { label: "Community", href: "/community" },
  { label: "Merch", href: "/merch" },
  { label: "Contact", href: "/contact" },
];

type FooterLink = { label: string; href: string; external?: boolean };

function FooterColumn({ heading, links }: { heading: string; links: FooterLink[] }) {
  return (
    <div>
      {/* h3 maintains heading hierarchy: h1 (hero) → h2 (sections) → h3 (footer) */}
      <h3 className="font-display uppercase tracking-widest text-brand-yellow mb-4 text-sm">{heading}</h3>
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
          className="block text-brand-white/60 hover:text-brand-white text-sm py-1 transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-brand-gray border-t border-brand-yellow/20 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-1">
            <Logo variant="square" size="md" />
            <p className="mt-4 text-brand-white/60 text-sm leading-relaxed">
              The global hub for flag football. Hosted by Ambra & Tika Marcucci,
              members of the Italian National Team.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              {socials.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-white/60 hover:text-brand-yellow text-sm font-display uppercase tracking-widest transition-colors"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
          <FooterColumn heading="Watch & Read" links={watchReadLinks} />
          <FooterColumn heading="Database" links={databaseLinks} />
          <FooterColumn heading="Compete" links={competeLinks} />
          <FooterColumn heading="Connect" links={connectLinks} />
        </div>
        {/* white/55 on #111111 bg = ~5.5:1 contrast ratio, meeting WCAG AA */}
        <div className="border-t border-brand-yellow/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-brand-white/55 text-xs">
            © {new Date().getFullYear()} Talkin Flag | The Talkin Balls Network
          </p>
          <p className="text-brand-white/55 text-xs">
            Hosted by <span className="text-brand-yellow">Ambra & Tika Marcucci</span> · Italian National Team 🇮🇹
          </p>
        </div>
      </div>
    </footer>
  );
}
