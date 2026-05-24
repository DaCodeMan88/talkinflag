import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { PlayerProvider } from "@/components/player/MiniPlayer";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Talkin Flag | The Global Flag Football Podcast",
  description: "Hosted by Ambra & Tika Marcucci of the Italian National Team. 39+ episodes with elite athletes, coaches, and founders building the future of flag football.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://talkinflag.com"),
  openGraph: {
    title: "Talkin Flag",
    description: "The global hub for flag football — podcast, players, rankings, events.",
    siteName: "Talkin Flag",
    type: "website",
    images: [{ url: "/og?title=The+Global+Flag+Football+Podcast", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@TalkinFlagShow",
    creator: "@TalkinFlagShow",
    title: "Talkin Flag",
    description: "The global hub for flag football — podcast, players, rankings, events.",
    images: ["/og?title=The+Global+Flag+Football+Podcast"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="bg-brand-black text-brand-white font-body antialiased">
        {/* Skip navigation for screen readers / keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-brand-yellow focus:text-brand-black focus:px-4 focus:py-2 focus:font-display focus:uppercase focus:text-sm"
        >
          Skip to content
        </a>
        <Nav />
        <PlayerProvider>
          <main id="main-content">{children}</main>
          <Footer />
        </PlayerProvider>
      </body>
    </html>
  );
}
