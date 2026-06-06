"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  followedId: string;
  followedType: "player" | "coach" | "team";
  isLoggedIn: boolean;
};

export default function FollowButton({ followedId, followedType, isLoggedIn }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    fetch(`/api/follows?followed_id=${followedId}&followed_type=${followedType}`)
      .then((r) => r.json())
      .then((d) => setFollowing(d.following))
      .finally(() => setLoading(false));
  }, [followedId, followedType, isLoggedIn]);

  async function toggle() {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    setPending(true);
    const method = following ? "DELETE" : "POST";
    await fetch("/api/follows", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followed_id: followedId, followed_type: followedType }),
    });
    setFollowing((f) => !f);
    setPending(false);
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`font-display uppercase tracking-widest text-xs px-5 py-2 border transition-colors disabled:opacity-50 ${
        following
          ? "bg-brand-yellow text-brand-black border-brand-yellow hover:bg-brand-yellow/80"
          : "bg-transparent text-brand-yellow border-brand-yellow/40 hover:border-brand-yellow hover:bg-brand-yellow/10"
      }`}
    >
      {following ? "✓ Following" : "+ Follow"}
    </button>
  );
}
