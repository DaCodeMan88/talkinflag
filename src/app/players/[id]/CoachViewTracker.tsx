"use client";
import { useEffect } from "react";

export default function CoachViewTracker({ playerId }: { playerId: string }) {
  useEffect(() => {
    fetch(`/api/players/${playerId}/view`, { method: "POST" }).catch(() => {});
  }, [playerId]);
  return null;
}
