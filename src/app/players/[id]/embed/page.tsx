import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { formatHeight, formatWeight } from "@/lib/measurements";
import { cohortRankLabel } from "@/lib/rankings/cohort";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

function formatLevel(level: string | null): string {
  if (!level) return "";
  const map: Record<string, string> = {
    high_school: "High School",
    college: "College",
    pro: "Pro",
    national_team: "National Team",
    youth: "Youth",
  };
  return map[level] ?? level.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PlayerEmbedPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: player } = await supabase
    .from("players")
    .select(
      "id, first_name, last_name, position, level, school_or_team, country, photo_url, ranking_national, height_in, weight_lbs, stats, is_verified"
    )
    .eq("id", id)
    .eq("is_approved", true)
    .single();

  if (!player) notFound();

  const stats = (player.stats ?? {}) as Record<string, string | number>;
  const keyStats: { label: string; value: string }[] = [];
  if (player.height_in) keyStats.push({ label: "Height", value: formatHeight(player.height_in) });
  if (player.weight_lbs) keyStats.push({ label: "Weight", value: formatWeight(player.weight_lbs) });
  if (stats.forty_yard) keyStats.push({ label: "40-Yd", value: `${stats.forty_yard}s` });

  const displayStats = keyStats.slice(0, 3);
  const levelStr = formatLevel(player.level);
  const profileUrl = `https://talkinflag.com/players/${player.id}`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>{player.first_name} {player.last_name} | Talkin Flag</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #000;
            font-family: system-ui, -apple-system, sans-serif;
            color: #fff;
            overflow: hidden;
          }
          .card {
            width: 400px;
            min-height: 220px;
            background: #0a0a0a;
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
            overflow: hidden;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: #FDDD58;
          }
          .header { display: flex; align-items: center; gap: 12px; }
          .photo {
            width: 56px; height: 56px;
            border-radius: 50%;
            object-fit: cover; object-position: top;
            border: 2px solid #FDDD58;
            flex-shrink: 0;
          }
          .initials {
            width: 56px; height: 56px;
            border-radius: 50%;
            background: rgba(253,221,88,0.1);
            border: 2px solid #FDDD58;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px; font-weight: 900;
            color: #FDDD58;
            flex-shrink: 0;
          }
          .name {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.01em;
            line-height: 1.1;
          }
          .meta {
            font-size: 11px;
            color: rgba(255,255,255,0.4);
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .verified {
            display: inline-block;
            background: rgba(253,221,88,0.15);
            color: #FDDD58;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 2px 7px;
            margin-top: 4px;
          }
          .rank {
            display: inline-block;
            background: #FDDD58;
            color: #000;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 3px 10px;
          }
          .stats { display: flex; gap: 16px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.07); }
          .stat-item { display: flex; flex-direction: column; gap: 2px; }
          .stat-val { font-size: 16px; font-weight: 700; color: #fff; }
          .stat-label { font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; }
          .footer {
            display: flex; align-items: center; justify-content: space-between;
            border-top: 1px solid rgba(255,255,255,0.07);
            padding-top: 10px;
          }
          .brand { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.2); }
          .cta {
            font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;
            color: #FDDD58; text-decoration: none; font-weight: 600;
          }
          .cta:hover { text-decoration: underline; }
        `}</style>
      </head>
      <body>
        <div className="card">
          {/* Header: photo + name */}
          <div className="header">
            {player.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photo_url} alt="" className="photo" />
            ) : (
              <div className="initials">
                {player.first_name[0]}{player.last_name[0]}
              </div>
            )}
            <div>
              <div className="name">{player.first_name} {player.last_name}</div>
              <div className="meta">
                {[player.position, levelStr, player.school_or_team, player.country]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {player.is_verified && <div className="verified">✓ Verified</div>}
            </div>
          </div>

          {/* Rank */}
          {cohortRankLabel(player.level, player.ranking_national) && (
            <div>
              <span className="rank">{cohortRankLabel(player.level, player.ranking_national)} — TF Rank</span>
            </div>
          )}

          {/* Stats */}
          {displayStats.length > 0 && (
            <div className="stats">
              {displayStats.map((s) => (
                <div key={s.label} className="stat-item">
                  <span className="stat-val">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <span className="brand">Talkin Flag</span>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="cta">
              Full Profile →
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
