import { createAdminClient } from "@/lib/eval/admin-client";
import { getAllPostRecords } from "@/lib/blog/posts";
import type { LinkTarget } from "@/lib/blog/links";

/**
 * Build the post + player link targets fed to the editor's internal-link
 * suggester. Both queries are guarded → [] on error so the editor never breaks.
 *
 * @param excludeSlug omit the post being edited (don't suggest linking to itself)
 */
export async function buildLinkTargets(
  excludeSlug?: string
): Promise<{ postTargets: LinkTarget[]; playerTargets: LinkTarget[] }> {
  let postTargets: LinkTarget[] = [];
  try {
    const posts = await getAllPostRecords();
    postTargets = posts
      .filter((p) => p.slug !== excludeSlug)
      .map((p) => ({ title: p.title, href: `/blog/${p.slug}` }));
  } catch {
    postTargets = [];
  }

  let playerTargets: LinkTarget[] = [];
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("players")
      .select("id, first_name, last_name")
      .eq("is_approved", true)
      .limit(500);
    playerTargets = (data ?? [])
      .map((r) => ({
        title: `${(r.first_name as string) ?? ""} ${(r.last_name as string) ?? ""}`.trim(),
        href: `/players/${r.id}`,
      }))
      .filter((t) => t.title);
  } catch {
    playerTargets = [];
  }

  return { postTargets, playerTargets };
}
