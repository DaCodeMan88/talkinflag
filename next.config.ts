import type { NextConfig } from "next";

const config: NextConfig = {
  async redirects() {
    return [
      { source: "/episodes", destination: "/podcast", permanent: true },
      { source: "/episodes/:id", destination: "/podcast/:id", permanent: true },
      // /community retired (Discord feature paused) — redirect indexed URL to podcast
      { source: "/community", destination: "/podcast", permanent: true },
      // Top 10 Plays / Athlete of the Week retired — redirect indexed URLs to /players (closest live equivalent: athlete discovery)
      { source: "/plays", destination: "/players", permanent: true },
      { source: "/plays/week/:week", destination: "/players", permanent: true },
      { source: "/athletes/featured", destination: "/players", permanent: true },
      { source: "/athletes", destination: "/players", permanent: true },
    ];
  },
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "files.cdn.printful.com" },
    ],
  },
  // Compress all responses
  compress: true,
  // Generate ETags for static assets
  generateEtags: true,
  // Strict mode for better React perf
  reactStrictMode: true,
  // PoweredByHeader off = remove fingerprinting
  poweredByHeader: false,
};

export default config;
