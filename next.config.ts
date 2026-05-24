import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "files.cdn.printful.com" },
    ],
  },
};

export default config;
