export interface Episode {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
  guestName?: string;
  episodeNumber?: number;
  youtubeUrl: string;
  tags?: string[];
}
