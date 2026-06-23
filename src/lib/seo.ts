import type { Metadata } from "next";

// Canonical production domain. Hardcoded because the domain is now fixed —
// this keeps canonicals/OG correct regardless of which host serves the app
// (e.g. *.vercel.app) and avoids depending on a stale NEXT_PUBLIC_SITE_URL.
export const siteUrl = "https://talkinflag.com";

export function buildMetadata({
  title,
  description,
  image,
  path = "",
  type = "website",
}: {
  title: string;
  description: string;
  image?: string;
  path?: string;
  type?: "website" | "article";
}): Metadata {
  const fullTitle = title.includes("Talkin Flag") ? title : `${title} | Talkin Flag`;
  const pageTitle = encodeURIComponent(fullTitle.replace(" | Talkin Flag", "").replace("Talkin Flag — ", "").replace("Talkin Flag | ", ""));
  const ogImage = image || `${siteUrl}/og?title=${pageTitle}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteUrl),
    ...(path && {
      alternates: {
        canonical: `${siteUrl}${path}`,
      },
    }),
    openGraph: {
      title: fullTitle,
      description,
      url: `${siteUrl}${path}`,
      siteName: "Talkin Flag",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type,
    },
    twitter: {
      card: "summary_large_image",
      site: "@TalkinFlagShow",
      creator: "@TalkinFlagShow",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
