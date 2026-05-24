"use client";
import dynamic from "next/dynamic";

const Globe = dynamic(
  () => import("@/components/map/GuestGlobe").then((m) => ({ default: m.GuestGlobe })),
  { ssr: false }
);

export function GlobeSection() {
  return <Globe />;
}
