export interface ClaimFields {
  is_claimed?: boolean | null;
  claim_pending?: boolean | null;
  claimed_by?: string | null;
}

export type ProfileBadge = "claimed" | "unclaimed" | "none";

export interface ProfileViewerState {
  isOwner: boolean;
  /** Claim approved and public — safe to show self-reported labels & ✓ Claimed. */
  claimApproved: boolean;
  /** Show the "Is this you? Claim Profile" CTA. */
  showClaimCta: boolean;
  /** Show the owner-only "This is your profile — Edit" bar. */
  showEditBar: boolean;
  /** Show the owner-only "claim pending review" bar. */
  showPendingBar: boolean;
  /** Show the "data compiled from public sources" notice (not publicly claimed, non-owner). */
  showDataNotice: boolean;
  badge: ProfileBadge;
}

/**
 * Single source of truth for how a profile renders to a given viewer.
 * `userId` is the signed-in user's id, or null when logged out.
 *
 * Rules:
 * - A pending claim never reads as "claimed" to the public (anti-impersonation):
 *   a stranger sees a pending-claim profile exactly as an unclaimed one, so a
 *   claim-in-review can't be used to impersonate a "verified" player in public.
 *   The owner, however, sees a "pending review" bar instead of the claim CTA
 *   (they already know they claimed it — no reason to re-prompt them).
 * - The owner of an approved claim gets an edit bar and never the claim CTA.
 */
export function profileViewerState(player: ClaimFields, userId: string | null): ProfileViewerState {
  const isClaimed = !!player.is_claimed;
  const isPending = !!player.claim_pending;
  const isOwner = !!userId && !!player.claimed_by && player.claimed_by === userId;
  const claimApproved = isClaimed && !isPending;

  const showClaimCta = !isClaimed && !isOwner;
  const showEditBar = isOwner && claimApproved;
  const showPendingBar = isOwner && isClaimed && isPending;
  // Keyed off claimApproved (not raw isClaimed) so this matches the badge's
  // public-facing signal: a pending claim reads as unclaimed to a stranger,
  // so the "data compiled from public sources" notice should show for them too.
  const showDataNotice = !claimApproved && !isOwner;

  let badge: ProfileBadge;
  if (claimApproved) {
    badge = "claimed";
  } else if (isPending && isOwner) {
    // Owner sees a neutral badge while their own claim is under review.
    badge = "none";
  } else {
    // Unclaimed, or a pending claim viewed by anyone but the owner —
    // publicly indistinguishable from unclaimed (anti-impersonation).
    badge = "unclaimed";
  }

  return { isOwner, claimApproved, showClaimCta, showEditBar, showPendingBar, showDataNotice, badge };
}
