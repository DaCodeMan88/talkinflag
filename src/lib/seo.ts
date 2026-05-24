import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://talkinflag.com";

export function buildMetadata({
  title,
  description,
  image,
  path = "",
}: {
  title: string;
  description: string;
  image?: string;
  path?: string;
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
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
