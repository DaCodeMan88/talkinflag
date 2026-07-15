import { Episode } from "@/types/episode";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  Recruiting:    ["recruit", "d1", "college", "scholarship", "offer"],
  Coaching:      ["coach", "coaching", "scheme", "playbook", "strategy"],
  International: ["world", "ifaf", "national team", "italy", "europe", "global", "olympic"],
  "Women's Flag":["women", "girl", "female"],
  Performance:   ["speed", "training", "athlete", "combine", "measurable"],
  Business:      ["brand", "sponsor", "media", "business", "startup", "league"],
  "Youth Flag":  ["youth", "high school", "hs", "prep"],
};

export function deriveTopicTags(title: string, description: string): string[] {
  const text = (title + " " + description).toLowerCase();
  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => text.includes(k)))
    .map(([tag]) => tag)
    .slice(0, 4);
}

export interface RawVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  durationSec: number; // 0 when unknown (channel-search path has no contentDetails call)
}

const SHORT_MAX_SEC = 180; // anything under 3 min is treated as a Short/reel

/** ISO‑8601 duration (e.g. "PT1M2S") → seconds. Returns 0 for unparseable input. */
export function parseIsoDuration(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!m) return 0;
  const [, h, min, s] = m;
  return (parseInt(h ?? "0") * 3600) + (parseInt(min ?? "0") * 60) + parseInt(s ?? "0");
}

/** True when a video is a Short/reel: too short, or explicitly tagged #shorts. */
export function isShort(v: { durationSec: number; title?: string }): boolean {
  if (v.durationSec > 0 && v.durationSec < SHORT_MAX_SEC) return true;
  return /#shorts?\b/i.test(v.title ?? "");
}

/** Pure: raw videos → episode list, Shorts removed, capped to `max`. */
export function selectEpisodes(videos: RawVideo[], max: number): Episode[] {
  return videos
    .filter((v) => !isShort(v))
    .slice(0, max)
    .map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      publishedAt: v.publishedAt,
      youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
      guestName: parseGuestName(v.title),
      episodeNumber: parseEpisodeNumber(v.title),
      tags: deriveTopicTags(v.title, v.description),
    }));
}

export async function getEpisodeById(id: string): Promise<Episode | null> {
  if (!API_KEY || API_KEY === "PLACEHOLDER_YOUTUBE_API_KEY") return null;

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("id", id);
    url.searchParams.set("part", "snippet");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const s = item.snippet;
    const title: string = s.title;
    const description: string = s.description ?? "";
    return {
      id,
      title,
      description,
      thumbnail: s.thumbnails?.maxres?.url ?? s.thumbnails?.high?.url ?? "",
      publishedAt: s.publishedAt,
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      guestName: parseGuestName(title),
      episodeNumber: parseEpisodeNumber(title),
      tags: deriveTopicTags(title, description),
    };
  } catch {
    return null;
  }
}

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;

type PlaylistSnippet = {
  title: string;
  description?: string;
  publishedAt: string;
  thumbnails?: Record<string, { url: string }>;
};

/** Fetch a playlist's videos (with durations) as RawVideo[], in playlist order. Empty on any failure. */
async function fetchPlaylistVideos(playlistId: string, maxResults: number): Promise<RawVideo[]> {
  if (!API_KEY || API_KEY === "PLACEHOLDER_YOUTUBE_API_KEY") return [];
  try {
    const listUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    listUrl.searchParams.set("key", API_KEY);
    listUrl.searchParams.set("playlistId", playlistId);
    listUrl.searchParams.set("maxResults", String(Math.min(maxResults, 50)));
    listUrl.searchParams.set("part", "snippet,contentDetails");
    const res = await fetch(listUrl.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error("YouTube playlistItems API error:", res.status);
      return [];
    }
    const data = await res.json();
    // Preserve playlist order — this is the source of truth for ordering
    // (playlistItems.list is ordered by playlist position; videos.list by
    // `id` is NOT guaranteed to preserve that order).
    const items: Array<{ snippet?: PlaylistSnippet; contentDetails?: { videoId?: string } }> = data.items ?? [];
    const ids = items.map((i) => i.contentDetails?.videoId).filter(Boolean) as string[];
    if (ids.length === 0) return [];

    // One videos call gets durations so we can drop Shorts — snippet fields
    // (title/description/thumbnail/publishedAt) already came from playlistItems
    // above, so we only pull contentDetails.duration out of this response.
    const vidUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    vidUrl.searchParams.set("key", API_KEY);
    vidUrl.searchParams.set("id", ids.join(","));
    vidUrl.searchParams.set("part", "contentDetails");
    const vres = await fetch(vidUrl.toString(), { next: { revalidate: 3600 } });
    if (!vres.ok) {
      console.error("YouTube videos API error:", vres.status);
      return [];
    }
    const vdata = await vres.json();
    const durationById = new Map<string, number>(
      (vdata.items ?? []).map((it: { id: string; contentDetails: { duration: string } }) => [
        it.id,
        parseIsoDuration(it.contentDetails.duration),
      ])
    );

    // Iterate the ORIGINAL playlistItems array (in playlist order) and
    // attach durations by id — this is what keeps ordering correct. Items
    // absent from durationById mean videos.list omitted them (deleted or
    // private video) — drop those, matching the old behavior of only
    // mapping over what videos.list actually returned.
    return items
      .filter((i): i is { snippet: PlaylistSnippet; contentDetails: { videoId: string } } =>
        Boolean(i.snippet && i.contentDetails?.videoId && durationById.has(i.contentDetails.videoId))
      )
      .map((i) => {
        const id = i.contentDetails.videoId;
        const s = i.snippet;
        return {
          id,
          title: s.title,
          description: s.description ?? "",
          thumbnail: s.thumbnails?.maxres?.url ?? s.thumbnails?.high?.url ?? s.thumbnails?.medium?.url ?? "",
          publishedAt: s.publishedAt,
          durationSec: durationById.get(id) ?? 0,
        };
      });
  } catch (err) {
    console.error("YouTube playlist fetch error:", err);
    return [];
  }
}

export async function getEpisodes(maxResults = 50): Promise<Episode[]> {
  if (!API_KEY || API_KEY === "PLACEHOLDER_YOUTUBE_API_KEY" || !CHANNEL_ID) {
    return getMockEpisodes(maxResults);
  }

  // Preferred: a curated podcast playlist (owner-controlled, no Shorts).
  if (PLAYLIST_ID) {
    const vids = await fetchPlaylistVideos(PLAYLIST_ID, maxResults);
    if (vids.length > 0) return selectEpisodes(vids, maxResults);
    // fall through to channel search if the playlist call yielded nothing
  }

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("key", API_KEY);
    searchUrl.searchParams.set("channelId", CHANNEL_ID);
    searchUrl.searchParams.set("q", "Talkin Flag");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("order", "date");
    searchUrl.searchParams.set("maxResults", String(maxResults));
    searchUrl.searchParams.set("part", "snippet");

    const res = await fetch(searchUrl.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error("YouTube API error:", res.status);
      return getMockEpisodes(maxResults);
    }

    const data = await res.json();

    if (!data.items?.length) {
      return getMockEpisodes(maxResults);
    }

    const raw: RawVideo[] = (data.items ?? []).map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          description: string;
          thumbnails: {
            high?: { url: string };
            medium?: { url: string };
            default?: { url: string };
          };
          publishedAt: string;
        };
      }): RawVideo => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        publishedAt: item.snippet.publishedAt,
        durationSec: 0, // search API has no duration; isShort falls back to #shorts title check
      })
    );

    if (raw.length === 0) return getMockEpisodes(maxResults);
    return selectEpisodes(raw, maxResults);
  } catch (err) {
    console.error("YouTube fetch error:", err);
    return getMockEpisodes(maxResults);
  }
}

function parseGuestName(title: string): string | undefined {
  const match = title.match(/\|\s*([^|:]+?)(?:\s*[:–]|$)/);
  return match?.[1]?.trim();
}

function parseEpisodeNumber(title: string): number | undefined {
  const match = title.match(/[Ee]p(?:isode)?\s*(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

function getMockEpisodes(count: number): Episode[] {
  const guests = [
    { name: "Phil Cutler", ep: 39, desc: "Adria Bowl 2026 Champion" },
    {
      name: "Liz Carmouche",
      ep: 38,
      desc: "MMA Champion turned flag football ambassador",
    },
    {
      name: "Marcus Thompson",
      ep: 37,
      desc: "Speed training and elite flag football performance",
    },
    {
      name: "Sofia Reyes",
      ep: 36,
      desc: "Women's flag football in Latin America",
    },
    {
      name: "James O'Brien",
      ep: 35,
      desc: "Flag football's path to mainstream media",
    },
    {
      name: "Anna Kowalski",
      ep: 34,
      desc: "Mental performance for flag football athletes",
    },
    {
      name: "David Chen",
      ep: 33,
      desc: "Building flag football communities in Asia",
    },
    {
      name: "Maria Santos",
      ep: 32,
      desc: "Brazilian flag football national team captain",
    },
  ];

  return guests.slice(0, count).map((g, i) => ({
    id: `mock-ep-${g.ep}`,
    title: `Ep ${g.ep} | ${g.name}: ${g.desc}`,
    description: `In this episode of Talkin Flag, Ambra and Tika sit down with ${g.name} to discuss ${g.desc.toLowerCase()}. A fascinating conversation about the future of flag football.`,
    thumbnail: `https://picsum.photos/seed/ep${g.ep}/480/360`,
    publishedAt: new Date(
      Date.now() - i * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    youtubeUrl: `https://www.youtube.com/watch?v=mock${g.ep}`,
    guestName: g.name,
    episodeNumber: g.ep,
    durationSec: 600,
  }));
}
