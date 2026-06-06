"use client";

import Link from "next/link";

type Spot = {
  id: string; position: string | null; target_grad_year: number | null;
  state_pref: string | null; description: string | null; created_at: string;
  coaches: { first_name: string; last_name: string; team: string; level: string };
};

type Props = {
  spots: Spot[];
  isPlayer: boolean;
};

const LEVEL_LABELS: Record<string, string> = {
  high_school: "High School",
  college: "College",
  national: "National",
};

export default function RosterSpotsBoard({ spots }: Props) {
  if (spots.length === 0) {
    return (
      <p className="text-brand-white/40 text-sm py-8 text-center">
        No open spots posted yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {spots.map((spot) => {
        const coach = spot.coaches;
        const levelLabel = LEVEL_LABELS[coach.level] ?? coach.level;
        const date = new Date(spot.created_at).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        });

        return (
          <div
            key={spot.id}
            className="border border-brand-white/10 p-4 flex flex-col gap-2 hover:border-brand-yellow/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-sm text-brand-white">
                  {coach.first_name} {coach.last_name}
                </p>
                <p className="text-brand-white/50 text-xs">{coach.team}</p>
              </div>
              <span className="text-brand-yellow text-[10px] font-display uppercase tracking-widest border border-brand-yellow/30 px-2 py-0.5 shrink-0">
                {levelLabel}
              </span>
            </div>

            <div className="flex gap-2 flex-wrap text-xs text-brand-white/50">
              {spot.position && (
                <span className="border border-brand-white/10 px-2 py-0.5">{spot.position}</span>
              )}
              {spot.target_grad_year && (
                <span className="border border-brand-white/10 px-2 py-0.5">
                  Class of {spot.target_grad_year}
                </span>
              )}
              {spot.state_pref && (
                <span className="border border-brand-white/10 px-2 py-0.5">{spot.state_pref}</span>
              )}
            </div>

            {spot.description && (
              <p className="text-brand-white/40 text-xs leading-relaxed line-clamp-3">
                {spot.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-1">
              <span className="text-brand-white/20 text-[10px]">{date}</span>
              <Link
                href="/coaches"
                className="text-xs font-display uppercase tracking-widest text-brand-white/50 hover:text-brand-yellow transition-colors"
              >
                View Profile →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
