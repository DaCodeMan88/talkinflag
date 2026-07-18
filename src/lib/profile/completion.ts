/**
 * Profile-completion percentage — single definition shared by the member
 * dashboard and the admin members directory so the numbers always agree.
 */
export function completionScore(
  player: Record<string, unknown>,
  stats: Record<string, unknown>
): number {
  const fields = [
    player.photo_url,
    player.bio,
    player.instagram,
    player.highlight_url,
    player.height_in,
    player.weight_lbs,
    stats.forty_yard,
    stats.occupation,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}
