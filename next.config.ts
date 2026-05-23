import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },           // YouTube thumbnails
      { protocol: "https", hostname: "picsum.photos" },          // Mock episode thumbnails
      { protocol: "https", hostname: "cdn.sanity.io" },          // Sanity (future)
      { protocol: "https", hostname: "files.cdn.printful.com" }, // Printful (future)
    ],
  },
};

export default config;
