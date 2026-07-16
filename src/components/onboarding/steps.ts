import type { TourStep } from "./GuidedTour";

// Member tour — runs on /dashboard. Targets reference data-tour attributes.
export const memberTourSteps: TourStep[] = [
  {
    title: "Welcome to Talkin Flag",
    body: "This is your dashboard — your home base on the global flag football hub. Let's take 30 seconds to show you around.",
  },
  {
    target: '[data-tour="profile"]',
    title: "Your Player Profile",
    body: "Build out your profile so coaches, scouts, and fans can find you. The completion bar shows what's left to add.",
  },
  {
    target: '[data-tour="insights"]',
    title: "Evaluation & Flag IQ",
    body: "Take the Athlete Evaluation to map how you judge talent, and the Flag IQ quiz to test your knowledge. Both sharpen your profile.",
  },
  {
    target: '[data-tour="verify"]',
    title: "Get Verified",
    body: "Submit your measurables for verification to earn the ✓ badge — verified stats carry the most weight in the TF Rankings.",
  },
  {
    target: '[data-tour="checklist"]',
    title: "Your Getting-Started Checklist",
    body: "Work through these steps any time. Come back here whenever you want to pick up where you left off.",
  },
];

// Admin tour — runs on /admin.
export const adminTourSteps: TourStep[] = [
  {
    title: "Welcome to the Admin Panel",
    body: "You can run nearly everything about the site and brand from here. Quick walkthrough of what you control.",
  },
  {
    target: '[data-tour="admin-players"]',
    title: "Manage Players",
    body: "Add, edit, verify, or remove any athlete in the database — fix data, create new profiles, and release wrong claims.",
  },
  {
    target: '[data-tour="admin-queues"]',
    title: "Review Queues",
    body: "Approve coach and scout applications, stat verifications, submitted events, and Top-10 highlights. Pending counts show here.",
  },
  {
    target: '[data-tour="admin-messages"]',
    title: "Contact Inbox",
    body: "Every message from the contact form lands here. Mark read, archive, and reply by email in one click.",
  },
  {
    target: '[data-tour="admin-rankings"]',
    title: "TF Rankings",
    body: "Recompute the community-weighted player rankings whenever polls or verified stats change. This is the 'better than MaxPreps' engine.",
  },
];
