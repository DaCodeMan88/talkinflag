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

export async function getEpisodes(maxResults = 50): Promise<Episode[]> {
  if (!API_KEY || API_KEY === "PLACEHOLDER_YOUTUBE_API_KEY" || !CHANNEL_ID) {
    return getMockEpisodes(maxResults);
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

    return data.items.map(
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
      }): Episode => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        publishedAt: item.snippet.publishedAt,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        guestName: parseGuestName(item.snippet.title),
        episodeNumber: parseEpisodeNumber(item.snippet.title),
      })
    );
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
  }));
}
