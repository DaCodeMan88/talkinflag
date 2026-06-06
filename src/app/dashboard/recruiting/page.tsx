import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostSpotForm from "./PostSpotForm";
import CloseSpotButton from "./CloseSpotButton";
import CoachShareCard from "./CoachShareCard";

export const metadata = {
  title: "My Recruiting Pipeline | Talkin Flag",
};

type PlayerRow = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  school_or_team: string | null;
  grad_year: number | null;
  photo_url: string | null;
};

type InterestRow = {
  player_id: string;
  message: string | null;
  created_at: string;
  players: PlayerRow | null;
};

type NoteRow = {
  player_id: string;
  note: string;
  updated_at: string;
  players: { first_name: string; last_name: string } | null;
};

type SpotRow = {
  id: string;
  position: string | null;
  target_grad_year: number | null;
  state_pref: string | null;
  description: string | null;
  created_at: string;
};

export default async function RecruitingDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/recruiting");
  }

  const { data: coach } = await supabase
    .from("coaches")
    .select("id, first_name, last_name, team, level, title, years_coaching, wins, losses, philosophy, bio")
    .eq("user_id", user.id)
    .eq("is_verified", true)
    .single();

  if (!coach) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-zinc-300 text-lg">This page is for verified coaches.</p>
        <Link
          href="/dashboard"
          className="text-[#FDDD58] hover:underline font-display"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const { data: interestsRaw } = await supabase
    .from("recruiting_interests")
    .select(
      "player_id, message, created_at, players(id, first_name, last_name, position, school_or_team, grad_year, photo_url)"
    )
    .eq("coach_id", coach.id)
    .order("created_at", { ascending: false });

  const { data: myNotesRaw } = await supabase
    .from("coach_player_notes")
    .select("player_id, note, updated_at, players(first_name, last_name)")
    .eq("coach_id", coach.id)
    .neq("note", "");

  const { data: mySpotsRaw } = await supabase
    .from("coach_roster_spots")
    .select("id, position, target_grad_year, state_pref, description, created_at")
    .eq("coach_id", coach.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const interests = (interestsRaw ?? []) as unknown as InterestRow[];
  const myNotes = (myNotesRaw ?? []) as unknown as NoteRow[];
  const mySpots = (mySpotsRaw ?? []) as unknown as SpotRow[];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-12">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-[#FDDD58] transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl text-[#FDDD58] mt-2">
            My Recruiting Pipeline
          </h1>
          <div className="flex items-center justify-between mt-1">
            <p className="text-zinc-400 text-sm">
              {coach.first_name} {coach.last_name}
              {coach.team ? ` · ${coach.team}` : ""}
              {coach.level ? ` · ${coach.level}` : ""}
            </p>
            <Link
              href="/dashboard/recruiting/edit"
              className="text-xs font-display uppercase tracking-widest text-[#FDDD58]/60 hover:text-[#FDDD58] transition-colors"
            >
              Edit Profile →
            </Link>
          </div>
        </div>

        {/* Section 1: Players I'm Following */}
        <section>
          <h2 className="font-display text-xl text-white mb-4">
            Players I&apos;m Following
          </h2>
          {interests.length === 0 ? (
            <p className="text-zinc-500 text-sm">
              No interests expressed yet.{" "}
              <Link
                href="/recruit"
                className="text-[#FDDD58] hover:underline"
              >
                Browse the recruit page
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {interests.map((interest) => {
                const player = interest.players;
                if (!player) return null;
                return (
                  <li
                    key={interest.player_id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Link
                        href={`/players/${player.id}`}
                        className="font-display text-lg text-[#FDDD58] hover:underline"
                      >
                        {player.first_name} {player.last_name}
                      </Link>
                      <span className="text-xs text-zinc-500">
                        {new Date(interest.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                      {player.position && <span>{player.position}</span>}
                      {player.school_or_team && (
                        <span>{player.school_or_team}</span>
                      )}
                      {player.grad_year && (
                        <span>Class of {player.grad_year}</span>
                      )}
                    </div>
                    {interest.message && (
                      <p className="text-sm text-zinc-500 italic mt-1">
                        &ldquo;{interest.message}&rdquo;
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Section 2: My Notes */}
        {myNotes.length > 0 && (
          <section id="my-notes">
            <h2 className="font-display text-xl text-white mb-4">My Notes</h2>
            <ul className="space-y-3">
              {myNotes.map((note) => (
                <li
                  key={note.player_id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-white">
                      {note.players
                        ? `${note.players.first_name} ${note.players.last_name}`
                        : "Unknown Player"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Updated {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {note.note}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Section 3: Open Roster Spots */}
        <section id="post-spot">
          <h2 className="font-display text-xl text-white mb-4">
            Open Roster Spots
          </h2>

          {mySpots.length > 0 ? (
            <ul className="space-y-3 mb-6">
              {mySpots.map((spot) => (
                <li
                  key={spot.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="text-[#FDDD58] font-display">
                        {spot.position ?? "Any Position"}
                      </span>
                      {spot.target_grad_year && (
                        <span className="text-zinc-300">
                          Class of {spot.target_grad_year}
                        </span>
                      )}
                      {spot.state_pref && (
                        <span className="text-zinc-400">{spot.state_pref}</span>
                      )}
                    </div>
                    <CloseSpotButton id={spot.id} />
                  </div>
                  {spot.description && (
                    <p className="text-sm text-zinc-400 mt-2">
                      {spot.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500 text-sm mb-6">
              No active roster spots posted.
            </p>
          )}

          <PostSpotForm />
        </section>
      </div>

      <CoachShareCard
        coachId={coach.id}
        coachName={`${coach.first_name} ${coach.last_name}`}
        team={coach.team}
        level={coach.level}
        title={coach.title ?? null}
        yearsCoaching={coach.years_coaching ?? null}
        wins={coach.wins ?? null}
        losses={coach.losses ?? null}
        philosophy={coach.philosophy ?? null}
        bio={coach.bio ?? null}
      />
    </div>
  );
}
