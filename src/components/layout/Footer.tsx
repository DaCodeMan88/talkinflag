import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const socials = [
  { label: "Instagram", href: "https://instagram.com/talkinflagshow" },
  { label: "YouTube", href: "https://youtube.com/@thetalkinballsnetwork" },
  { label: "Spotify", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-brand-gray border-t border-brand-yellow/20 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <Logo variant="square" size="md" />
            <p className="mt-4 text-brand-white/60 text-sm leading-relaxed max-w-xs">
              The global hub for flag football. Hosted by Ambra & Tika Marcucci,
              members of the Italian National Team.
            </p>
            <div className="flex gap-4 mt-6">
              {socials.map((s) => (
                <Link key={s.label} href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-brand-white/60 hover:text-brand-yellow text-sm font-display uppercase tracking-widest transition-colors">
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display uppercase tracking-widest text-brand-yellow mb-4 text-sm">Media</h4>
            {["Episodes", "Blog", "Guests", "Network"].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className="block text-brand-white/60 hover:text-brand-white text-sm py-1 transition-colors">
                {item}
              </Link>
            ))}
          </div>
          <div>
            <h4 className="font-display uppercase tracking-widest text-brand-yellow mb-4 text-sm">Platform</h4>
            {["Players", "Rankings", "Events", "Merch", "Recruit"].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className="block text-brand-white/60 hover:text-brand-white text-sm py-1 transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-brand-yellow/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-brand-white/40 text-xs">
            © {new Date().getFullYear()} Talkin Flag | The Talkin Balls Network
          </p>
          <p className="text-brand-white/40 text-xs">
            Hosted by <span className="text-brand-yellow">Ambra & Tika Marcucci</span> · Italian National Team 🇮🇹
          </p>
        </div>
      </div>
    </footer>
  );
}
