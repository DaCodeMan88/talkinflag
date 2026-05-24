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
  const ogImage = image || `${siteUrl}/og-image.png`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteUrl),
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
