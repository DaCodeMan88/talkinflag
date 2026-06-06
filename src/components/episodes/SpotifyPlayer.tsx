interface SpotifyPlayerProps {
  /** Spotify show ID (from the Spotify for Podcasters dashboard URL). */
  showId?: string;
  /** Optional specific episode ID to feature instead of the whole show. */
  episodeId?: string;
  /** Compact (152px) vs. full (352px) player height. */
  compact?: boolean;
  title?: string;
}

/**
 * Spotify embed player for the podcast.
 * Renders nothing until a `showId` (or `episodeId`) is supplied — so it can be
 * wired into the page now and "activated" the moment the owner provides the ID
 * (via the NEXT_PUBLIC_SPOTIFY_SHOW_ID env var or a hard-coded value).
 *
 * Uses a single lazy-loaded iframe; no third-party scripts run on page init.
 */
export function SpotifyPlayer({
  showId,
  episodeId,
  compact = false,
  title = "Listen on Spotify",
}: SpotifyPlayerProps) {
  if (!showId && !episodeId) return null;

  const path = episodeId ? `episode/${episodeId}` : `show/${showId}`;
  const height = compact ? 152 : 352;

  return (
    <iframe
      title={title}
      src={`https://open.spotify.com/embed/${path}?utm_source=generator&theme=0`}
      width="100%"
      height={height}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      style={{ border: 0, borderRadius: 12 }}
    />
  );
}
