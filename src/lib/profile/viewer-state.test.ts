import { describe, it, expect } from "vitest";
import { profileViewerState } from "./viewer-state";

const base = { is_claimed: false, claim_pending: false, claimed_by: null as string | null };

describe("profileViewerState", () => {
  it("stranger, unclaimed profile → claim CTA + unclaimed badge, no edit bar", () => {
    const s = profileViewerState(base, "viewer-1");
    expect(s).toMatchObject({ isOwner: false, showClaimCta: true, badge: "unclaimed", showEditBar: false, showDataNotice: true });
  });

  it("owner of an approved claim → edit bar, claimed badge, no CTA, no data notice", () => {
    const s = profileViewerState({ is_claimed: true, claim_pending: false, claimed_by: "u1" }, "u1");
    expect(s).toMatchObject({ isOwner: true, showClaimCta: false, badge: "claimed", showEditBar: true, showDataNotice: false });
  });

  it("owner while claim still pending → pending bar, no CTA, no public claimed badge", () => {
    const s = profileViewerState({ is_claimed: true, claim_pending: true, claimed_by: "u1" }, "u1");
    expect(s).toMatchObject({ isOwner: true, showClaimCta: false, badge: "none", showEditBar: false, showPendingBar: true });
  });

  it("stranger viewing an approved claimed profile → claimed badge, no CTA", () => {
    const s = profileViewerState({ is_claimed: true, claim_pending: false, claimed_by: "u1" }, "viewer-2");
    expect(s).toMatchObject({ isOwner: false, showClaimCta: false, badge: "claimed", showEditBar: false });
  });

  it("logged-out viewer on unclaimed profile → claim CTA", () => {
    const s = profileViewerState(base, null);
    expect(s).toMatchObject({ isOwner: false, showClaimCta: true, badge: "unclaimed" });
  });

  it("stranger viewing a pending claim → reads as unclaimed publicly (anti-impersonation)", () => {
    const s = profileViewerState({ is_claimed: true, claim_pending: true, claimed_by: "u1" }, "viewer-2");
    expect(s).toMatchObject({ isOwner: false, badge: "unclaimed", showClaimCta: false });
  });
});
