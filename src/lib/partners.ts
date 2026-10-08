import { createAdminClient } from "@/lib/eval/admin-client";

export interface Partner {
  id?: string;
  name: string;
  url: string;
  position: number;
  is_live: boolean;
}

/** Only absolute http(s) links render. Mirrors the CHECK on partners.url. */
export function isPartnerUrl(url: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(url.trim());
}

/** Live partners in position order; ties break on name so order never flickers. */
export function selectLivePartners<T extends Pick<Partner, "name" | "position" | "is_live" | "url">>(rows: T[]): T[] {
  return rows
    .filter((p) => p.is_live && isPartnerUrl(p.url))
    .sort((a, b) => a.position - b.position || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/**
 * Snapshot of the seed in migration 028, used only when the table read fails.
 * Like FALLBACK_POSTS in lib/media/instagram.ts it does not track Ambra's
 * edits; refresh it by hand if the live list changes a lot.
 */
export const FALLBACK_PARTNERS: Partner[] = [
  { name: "Flag Football Finder", url: "https://flagfootballfinder.com", position: 0, is_live: true },
  { name: "Flag Football Nation", url: "https://www.instagram.com/flagfootballnationofficial/", position: 1, is_live: true },
  { name: "Women's College Flag Football", url: "https://www.womenscollegeflagfootball.com", position: 2, is_live: true },
];

/**
 * Service-role read (not a cookie client) so the homepage can stay static
 * with revalidate, same reasoning as getLiveInstagramPosts.
 */
export async function getLivePartners(): Promise<Partner[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("partners")
      .select("id, name, url, position, is_live")
      .eq("is_live", true)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    // An empty list is a real choice (Ambra hid every partner), so it is
    // honoured rather than replaced by the fallback.
    return selectLivePartners((data ?? []) as Partner[]);
  } catch (e) {
    console.error("getLivePartners:", e instanceof Error ? e.message : e);
    return FALLBACK_PARTNERS;
  }
}
