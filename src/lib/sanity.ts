import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const sanityConfigured =
  !!projectId && projectId !== "PLACEHOLDER_SANITY_PROJECT_ID";

export const sanityClient = sanityConfigured
  ? createClient({
      projectId: projectId!,
      dataset,
      apiVersion: "2024-01-01",
      useCdn: true,
    })
  : null;

const builder = sanityClient ? imageUrlBuilder(sanityClient) : null;

export function urlFor(source: SanityImageSource) {
  return builder?.image(source);
}

export interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  author: string;
  category: string;
  excerpt: string;
  mainImage: string;
}

export interface SanityPostFull extends SanityPost {
  body: unknown[];
}

export async function getAllPosts(): Promise<SanityPost[]> {
  if (!sanityClient) return [];
  try {
    return await sanityClient.fetch(`
      *[_type == "post"] | order(publishedAt desc) {
        _id, title, slug, publishedAt, author, category, excerpt,
        "mainImage": mainImage.asset->url
      }
    `);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<SanityPostFull | null> {
  if (!sanityClient) return null;
  try {
    return await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        _id, title, slug, publishedAt, author, category, excerpt,
        "mainImage": mainImage.asset->url,
        body
      }`,
      { slug }
    );
  } catch {
    return null;
  }
}
