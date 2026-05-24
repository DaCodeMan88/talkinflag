import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
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
