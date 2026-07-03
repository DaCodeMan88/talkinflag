import type { MetadataRoute } from "next";
import { getEpisodes } from "@/lib/youtube";
import { createServerClient } from "@/lib/supabase";
import { staticPosts } from "@/lib/static-posts";
import { getAllPosts, sanityConfigured } from "@/lib/sanity";
import type { Player } from "@/types/player";

const BASE_URL = "https://talkinflag.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/podcast`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/players`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/merch`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/recruit`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/players/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/events/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/coaches`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/scouts/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/how-rankings-work`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/results`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/evaluate`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/iq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // ── Episode pages ─────────────────────────────────────────────────────────
  let episodePages: MetadataRoute.Sitemap = [];
  try {
    const episodes = await getEpisodes(50);
    episodePages = episodes.map((ep) => ({
      url: `${BASE_URL}/podcast/${ep.id}`,
      lastModified: new Date(ep.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // YouTube unavailable — skip episode pages
  }

  // ── Blog pages ────────────────────────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = staticPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  if (sanityConfigured) {
    try {
      const sanityPosts = await getAllPosts();
      const sanityBlogPages: MetadataRoute.Sitemap = sanityPosts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug.current}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
      blogPages.push(...sanityBlogPages);
    } catch {
      // Sanity unavailable
    }
  }

  // ── Player, Event + Coach pages (from Supabase) ───────────────────────────
  let playerPages: MetadataRoute.Sitemap = [];
  let eventPages: MetadataRoute.Sitemap = [];
  let coachPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServerClient();
    const today = new Date().toISOString().split("T")[0];

    const [playersResult, eventsResult, coachesResult] = await Promise.all([
      supabase.from("players").select("id, updated_at").eq("is_verified", true).eq("is_approved", true),
      supabase.from("events").select("id, start_date").eq("is_approved", true).gte("start_date", today),
      supabase.from("coaches").select("id, updated_at").eq("is_verified", true),
    ]);
    const players = playersResult.data as Pick<Player, "id" | "updated_at">[] | null;
    const events = eventsResult.data as { id: string; start_date: string }[] | null;
    const coaches = coachesResult.data as { id: string; updated_at?: string }[] | null;

    if (players) {
      playerPages = players.map((p) => ({
        url: `${BASE_URL}/players/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }

    if (events) {
      eventPages = events.map((e) => ({
        url: `${BASE_URL}/events/${e.id}`,
        lastModified: new Date(e.start_date),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }

    if (coaches) {
      coachPages = coaches.map((c) => ({
        url: `${BASE_URL}/coaches/${c.id}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Supabase unavailable
  }

  return [...staticPages, ...episodePages, ...blogPages, ...playerPages, ...eventPages, ...coachPages];
}
