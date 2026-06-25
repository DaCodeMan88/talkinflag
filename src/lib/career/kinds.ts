// Phase F — career-update domain model (pure, framework-free, unit-tested).
// Defines the kinds of career updates a member can submit, which roles may
// submit each, which fields each needs, and which kinds can move player ranks.

export type CareerRole = "player" | "coach" | "expert";

export type CareerKind =
  | "championship"
  | "postseason"
  | "title_game"
  | "award"
  | "role_change"
  | "event_covered"
  | "clinic_hosted"
  | "other";

export type CareerField =
  | "title"
  | "team"
  | "level"
  | "new_role"
  | "date"
  | "description";

export interface KindDef {
  kind: CareerKind;
  label: string;
  /** Roles allowed to submit this kind. */
  roles: CareerRole[];
  /** Approving this kind can affect player rankings (verified achievement). */
  rankingRelevant: boolean;
  /** Detail fields to collect for this kind. */
  fields: CareerField[];
}

export const CAREER_KINDS: KindDef[] = [
  { kind: "championship",  label: "Won a Championship",     roles: ["player", "coach"],            rankingRelevant: true,  fields: ["title", "team", "date", "description"] },
  { kind: "postseason",    label: "Postseason Appearance",  roles: ["player", "coach"],            rankingRelevant: true,  fields: ["title", "team", "date", "description"] },
  { kind: "title_game",    label: "Reached a Title Game",   roles: ["player", "coach"],            rankingRelevant: true,  fields: ["title", "team", "date", "description"] },
  { kind: "award",         label: "Award / Honor",          roles: ["player", "coach", "expert"],  rankingRelevant: true,  fields: ["title", "date", "description"] },
  { kind: "role_change",   label: "New Role / Team",        roles: ["coach", "expert"],            rankingRelevant: false, fields: ["new_role", "team", "level", "date", "description"] },
  { kind: "event_covered", label: "Event Covered",          roles: ["expert", "coach"],            rankingRelevant: false, fields: ["title", "date", "description"] },
  { kind: "clinic_hosted", label: "Clinic Hosted",          roles: ["coach", "expert"],            rankingRelevant: false, fields: ["title", "date", "description"] },
  { kind: "other",         label: "Other Update",           roles: ["player", "coach", "expert"],  rankingRelevant: false, fields: ["title", "description"] },
];

const BY_KIND: Record<string, KindDef> = Object.fromEntries(CAREER_KINDS.map((k) => [k.kind, k]));

export function isValidKind(kind: string): kind is CareerKind {
  return kind in BY_KIND;
}

export function kindDef(kind: string): KindDef | null {
  return BY_KIND[kind] ?? null;
}

export function kindLabel(kind: string): string {
  return BY_KIND[kind]?.label ?? kind.replace(/_/g, " ");
}

export function isRankingRelevant(kind: string): boolean {
  return BY_KIND[kind]?.rankingRelevant ?? false;
}

/** Kinds a member can submit given the roles they hold (deduped, player always allowed). */
export function kindsForRoles(roles: CareerRole[]): KindDef[] {
  const set = new Set<CareerRole>(roles.length ? roles : ["player"]);
  // Players can always log achievements about themselves.
  set.add("player");
  return CAREER_KINDS.filter((k) => k.roles.some((r) => set.has(r)));
}

/**
 * Are the published rankings stale relative to the last recompute?
 * True when a ranking-relevant update was approved after the last recompute
 * (or there has never been a recompute but such an approval exists).
 */
export function rankingsStale(
  lastRecomputeAt: string | null,
  latestRelevantApprovalAt: string | null,
): boolean {
  if (!latestRelevantApprovalAt) return false;
  if (!lastRecomputeAt) return true;
  return new Date(latestRelevantApprovalAt).getTime() > new Date(lastRecomputeAt).getTime();
}
