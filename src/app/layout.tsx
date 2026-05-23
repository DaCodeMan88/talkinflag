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
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Talkin Flag",
    description: "The global hub for flag football — podcast, players, rankings, events.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="bg-brand-black text-brand-white font-body antialiased">
        <Nav />
        <PlayerProvider>
          <main>{children}</main>
          <Footer />
        </PlayerProvider>
      </body>
    </html>
  );
}
