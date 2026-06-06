"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MENS_WORLD_RANKINGS,
  WOMENS_WORLD_RANKINGS,
  COLLEGE_RANKINGS,
  HS_RANKINGS,
  getFlag,
  type WorldTeam,
} from "@/lib/world-rankings";

type NationalCoach = {
  id: string;
  first_name: string;
  last_name: string;
  team: string | null;
  title: string | null;
  wins: number | null;
  losses: number | null;
};

type NationalPlayer = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  country: string | null;
  school_or_team: string | null;
};

type Tab = "highschool" | "college" | "world";
type Gender = "mens" | "womens";

// ─── High School Tab ─────────────────────────────────────────────────────────

function HighSchoolTab() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All");

  const states = useMemo(() => {
    const s = Array.from(new Set(HS_RANKINGS.map((t) => t.state))).sort();
    return ["All", ...s];
  }, []);

  const filtered = useMemo(() => {
    let list = HS_RANKINGS;
    if (stateFilter !== "All") list = list.filter((t) => t.state === stateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.school.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q) ||
          t.stateFull.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, stateFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
            Girls Flag Football — National Top 50
          </h2>
          <p className="text-brand-white/40 text-xs mt-1">
            Curated rankings · 2025–26 season · Source: MaxPreps, FHSAA & state athletic associations
          </p>
        </div>
        <a
          href="https://www.maxpreps.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-white/30 font-display text-[10px] uppercase tracking-widest hover:text-brand-yellow transition-colors shrink-0"
        >
          Source: MaxPreps ↗
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="bg-[#111111] border border-brand-white/15 text-brand-white/70 px-3 py-1.5 text-xs focus:border-brand-yellow focus:outline-none"
          aria-label="Filter by state"
        >
          {states.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All States" : s}</option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search school or city…"
          aria-label="Search teams"
          className="flex-1 min-w-[180px] bg-[#111111] border border-brand-white/15 text-brand-white px-3 py-1.5 text-xs focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Girls flag football national top 50">
          <thead>
            <tr className="border-b border-brand-yellow/20">
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-10">#</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">School</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden sm:table-cell">City</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-10">St.</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden md:table-cell w-20">Record</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 hidden lg:table-cell w-16">Titles</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-brand-white/40 text-xs">
                  No teams match your search.
                </td>
              </tr>
            ) : (
              filtered.map((team) => (
                <tr key={team.rank} className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors group">
                  <td className="py-3 pr-4 text-brand-yellow font-display">{team.rank}</td>
                  <td className="py-3 pr-4">
                    <div className="text-brand-white font-medium">{team.school}</div>
                    {team.notes && (
                      <div className="text-brand-white/35 text-[11px] mt-0.5 hidden group-hover:block lg:hidden">
                        {team.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-brand-white/50 text-xs hidden sm:table-cell">{team.city}</td>
                  <td className="py-3 pr-4 text-brand-white/50 text-xs">{team.state}</td>
                  <td className="py-3 pr-4 text-brand-white/50 text-xs hidden md:table-cell tabular-nums">{team.record ?? "—"}</td>
                  <td className="py-3 hidden lg:table-cell">
                    {team.stateTitles ? (
                      <span className="font-display text-[10px] uppercase tracking-widest bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5">
                        {team.stateTitles}× State
                      </span>
                    ) : (
                      <span className="text-brand-white/20 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-brand-white/25 text-xs">
        Rankings are curated based on available public data. Records and titles reflect 2025–26 season where available.
      </p>
    </div>
  );
}

// ─── College Tab ─────────────────────────────────────────────────────────────

type CollegeDivFilter = "All" | "DI" | "DII" | "DIII" | "NAIA";

function CollegeTab() {
  const [divFilter, setDivFilter] = useState<CollegeDivFilter>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = COLLEGE_RANKINGS;
    if (divFilter !== "All") list = list.filter((t) => t.division === divFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.school.toLowerCase().includes(q) ||
          t.state.toLowerCase().includes(q) ||
          (t.conference?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [divFilter, search]);

  const divs: CollegeDivFilter[] = ["All", "DI", "DII", "DIII", "NAIA"];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
            Women&apos;s College Flag Football — Power Rankings
          </h2>
          <p className="text-brand-white/40 text-xs mt-1">
            Curated top 25 · Spring 2026 · Sources: collegiateflagfootball.com, conference sites
          </p>
        </div>
        <a
          href="https://www.collegiateflagfootball.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-white/30 font-display text-[10px] uppercase tracking-widest hover:text-brand-yellow transition-colors shrink-0"
        >
          Source ↗
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1" role="group" aria-label="Filter by division">
          {divs.map((d) => (
            <button
              key={d}
              onClick={() => setDivFilter(d)}
              className={`font-display text-xs uppercase tracking-widest px-3 py-1.5 transition-colors ${
                divFilter === d
                  ? "bg-brand-yellow text-brand-black"
                  : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search school, state, conference…"
          aria-label="Search programs"
          className="flex-1 min-w-[180px] bg-[#111111] border border-brand-white/15 text-brand-white px-3 py-1.5 text-xs focus:border-brand-yellow focus:outline-none placeholder:text-brand-white/25"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Women's college flag football power rankings">
          <thead>
            <tr className="border-b border-brand-yellow/20">
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-10">#</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">School</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-10">St.</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-16">Div.</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden sm:table-cell">Conference</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden md:table-cell w-20">Record</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-brand-white/40 text-xs">
                  No programs match your search.
                </td>
              </tr>
            ) : (
              filtered.map((prog) => (
                <tr key={prog.rank} className="border-b border-brand-white/5 hover:bg-brand-white/5 transition-colors group">
                  <td className="py-3 pr-4 text-brand-yellow font-display font-bold">{prog.rank}</td>
                  <td className="py-3 pr-4">
                    <div className="text-brand-white font-medium">{prog.school}</div>
                    {prog.notes && (
                      <div className="text-brand-white/35 text-[11px] mt-0.5">{prog.notes}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-brand-white/50 text-xs">{prog.state}</td>
                  <td className="py-3 pr-4">
                    <span className={`font-display text-[10px] uppercase tracking-widest px-1.5 py-0.5 ${
                      prog.division === "DI"   ? "bg-brand-yellow/20 text-brand-yellow" :
                      prog.division === "DII"  ? "bg-blue-500/20 text-blue-300" :
                      prog.division === "NAIA" ? "bg-purple-500/20 text-purple-300" :
                                                 "bg-brand-white/10 text-brand-white/60"
                    }`}>
                      {prog.division}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-brand-white/50 text-xs hidden sm:table-cell">{prog.conference ?? "—"}</td>
                  <td className="py-3 pr-4 text-brand-white/50 text-xs hidden md:table-cell tabular-nums">{prog.record ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-brand-white/25 text-xs">
        Power rankings are curated and updated each season. NCAA flag football was adopted as an Emerging Sport for Women in January 2026.
      </p>
    </div>
  );
}

// ─── World Tab ────────────────────────────────────────────────────────────────

function WorldTeamRow({
  team,
  expanded,
  onToggle,
  coaches,
  players,
}: {
  team: WorldTeam;
  expanded: boolean;
  onToggle: () => void;
  coaches: NationalCoach[];
  players: NationalPlayer[];
}) {
  const matchedCoaches = coaches.filter((c) =>
    c.team?.toLowerCase().includes(team.nation.toLowerCase())
  );
  const matchedPlayers = players.filter((p) =>
    p.country?.toLowerCase() === team.nation.toLowerCase()
  );
  const hasProfile = !!(
    team.yearEstablished ||
    team.accomplishments?.length ||
    team.keyPlayers?.length ||
    team.notes ||
    matchedCoaches.length ||
    matchedPlayers.length
  );

  return (
    <>
      <tr
        className={`border-b border-brand-white/5 transition-colors ${hasProfile ? "cursor-pointer hover:bg-brand-white/5" : ""} ${expanded ? "bg-brand-white/5" : ""}`}
        onClick={hasProfile ? onToggle : undefined}
        aria-expanded={hasProfile ? expanded : undefined}
      >
        <td className="py-3 pr-4 text-brand-yellow font-display">{team.rank}</td>
        <td className="py-3 pr-4">
          <span className="inline-flex items-center gap-3 text-brand-white">
            <span className="text-lg leading-none" aria-hidden="true">{getFlag(team.nation)}</span>
            <span className="font-medium">{team.nation}</span>
            {hasProfile && (
              <span className={`ml-1 text-brand-white/25 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true">
                ▼
              </span>
            )}
          </span>
        </td>
        <td className="py-3 pr-4 text-brand-white/40 text-xs hidden sm:table-cell tabular-nums">
          {team.yearEstablished ? `Est. ${team.yearEstablished}` : "—"}
        </td>
        <td className="py-3 text-right text-brand-white/60 tabular-nums">
          {team.points.toLocaleString()}
        </td>
      </tr>

      {expanded && hasProfile && (
        <tr className="border-b border-brand-yellow/10 bg-brand-white/[0.03]">
          <td colSpan={4} className="px-4 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              {team.recentRecord && (
                <div>
                  <div className="font-display text-[10px] uppercase tracking-widest text-brand-yellow mb-1.5">Recent Result</div>
                  <div className="text-brand-white/70">{team.recentRecord}</div>
                </div>
              )}
              {team.accomplishments && team.accomplishments.length > 0 && (
                <div>
                  <div className="font-display text-[10px] uppercase tracking-widest text-brand-yellow mb-1.5">Accomplishments</div>
                  <ul className="space-y-1">
                    {team.accomplishments.map((a, i) => (
                      <li key={i} className="text-brand-white/70 flex gap-2">
                        <span className="text-brand-yellow mt-px">—</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {team.keyPlayers && team.keyPlayers.length > 0 && (
                <div>
                  <div className="font-display text-[10px] uppercase tracking-widest text-brand-yellow mb-1.5">Key Players</div>
                  <ul className="space-y-1">
                    {team.keyPlayers.map((p, i) => (
                      <li key={i} className="text-brand-white/70">{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {team.headCoach && (
                <div>
                  <div className="font-display text-[10px] uppercase tracking-widest text-brand-yellow mb-1.5">Head Coach</div>
                  <div className="text-brand-white/70">{team.headCoach}</div>
                </div>
              )}
              {matchedCoaches.length > 0 && (
                <div>
                  <div className="font-display text-[10px] uppercase tracking-widest text-brand-yellow mb-1.5">
                    Verified Coach{matchedCoaches.length > 1 ? "es" : ""}
                  </div>
                  <ul className="space-y-1.5">
                    {matchedCoaches.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/coaches/${c.id}`}
                          className="text-brand-white hover:text-brand-yellow transition-colors"
                        >
                          {c.first_name} {c.last_name}
                        </Link>
                        {c.title && (
                          <span className="text-brand-white/40 text-[11px] block">{c.title}</span>
                        )}
                        {(c.wins !== null || c.losses !== null) && (
                          <span className="text-brand-white/40 text-[11px]">
                            {c.wins ?? "—"}–{c.losses ?? "—"} record
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {matchedPlayers.length > 0 && (
                <div>
                  <div className="font-display text-[10px] uppercase tracking-widest text-brand-yellow mb-1.5">
                    Roster ({matchedPlayers.length})
                  </div>
                  <ul className="space-y-1">
                    {matchedPlayers.slice(0, 8).map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/players/${p.id}`}
                          className="text-brand-white/70 hover:text-brand-yellow transition-colors"
                        >
                          {p.first_name} {p.last_name}
                          {p.position && <span className="text-brand-white/35 ml-1">· {p.position}</span>}
                        </Link>
                      </li>
                    ))}
                    {matchedPlayers.length > 8 && (
                      <li className="text-brand-white/30 text-[11px]">+{matchedPlayers.length - 8} more</li>
                    )}
                  </ul>
                </div>
              )}
              {team.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="font-display text-[10px] uppercase tracking-widest text-brand-yellow mb-1.5">About</div>
                  <p className="text-brand-white/60 leading-relaxed">{team.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function WorldTab({ coaches, players }: { coaches: NationalCoach[]; players: NationalPlayer[] }) {
  const [gender, setGender] = useState<Gender>("mens");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rankings = gender === "mens" ? MENS_WORLD_RANKINGS : WOMENS_WORLD_RANKINGS;

  function toggle(nation: string) {
    setExpanded((prev) => (prev === nation ? null : nation));
  }

  return (
    <div>
      {/* Gender toggle */}
      <div className="flex items-center gap-2 mb-6" role="group" aria-label="Filter by gender">
        {(["mens", "womens"] as Gender[]).map((g) => (
          <button
            key={g}
            onClick={() => { setGender(g); setExpanded(null); }}
            className={`font-display text-xs uppercase tracking-widest px-4 py-2 transition-colors ${
              gender === g
                ? "bg-brand-yellow text-brand-black"
                : "border border-brand-white/20 text-brand-white/60 hover:border-brand-white/40 hover:text-brand-white"
            }`}
          >
            {g === "mens" ? "Men's" : "Women's"}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-brand-yellow">
          {gender === "mens" ? "Men's" : "Women's"} 2025 IFAF Flag Football World Rankings
        </h2>
        <a
          href="https://www.americanfootball.sport/ifaf-world-rankings/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-white/30 font-display text-[10px] uppercase tracking-widest hover:text-brand-yellow transition-colors"
        >
          Source: IFAF ↗
        </a>
      </div>

      <p className="text-brand-white/35 text-xs mb-4">Click a nation to view team profile.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={`${gender === "mens" ? "Men's" : "Women's"} IFAF world rankings`}>
          <thead>
            <tr className="border-b border-brand-yellow/20">
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 w-12">#</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4">Nation</th>
              <th className="text-left font-display text-xs uppercase tracking-widest text-brand-yellow pb-3 pr-4 hidden sm:table-cell w-28">Est.</th>
              <th className="text-right font-display text-xs uppercase tracking-widest text-brand-yellow pb-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((team, i) => (
              <WorldTeamRow
                key={`${team.nation}-${i}`}
                team={team}
                expanded={expanded === team.nation}
                onToggle={() => toggle(team.nation)}
                coaches={coaches}
                players={players}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-brand-white/25 text-xs">
        Rankings updated annually by IFAF based on results in international competition. Click any nation for team details.
      </p>
    </div>
  );
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────

export function TeamsHub({
  nationalCoaches = [],
  nationalPlayers = [],
}: {
  nationalCoaches?: NationalCoach[];
  nationalPlayers?: NationalPlayer[];
}) {
  const [tab, setTab] = useState<Tab>("highschool");

  const tabs: { id: Tab; label: string }[] = [
    { id: "highschool", label: "High School" },
    { id: "college",    label: "College"     },
    { id: "world",      label: "World"       },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-10 border-b border-brand-white/10" role="tablist">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`font-display text-xs uppercase tracking-widest px-5 py-3 transition-colors border-b-2 -mb-px ${
              tab === id
                ? "text-brand-yellow border-brand-yellow"
                : "text-brand-white/40 border-transparent hover:text-brand-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "highschool" && <HighSchoolTab />}
      {tab === "college"    && <CollegeTab />}
      {tab === "world"      && <WorldTab coaches={nationalCoaches} players={nationalPlayers} />}
    </div>
  );
}
