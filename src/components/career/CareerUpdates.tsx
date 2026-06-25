// Profile freshness signal (Phase F): shows a member's approved career updates.
// Server component — reads via the service-role client inside the service layer.
import { getApprovedUpdatesForUser } from "@/lib/career/service";
import { kindLabel } from "@/lib/career/kinds";

function fmt(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default async function CareerUpdates({
  userId,
  heading = "Career Updates",
}: {
  userId: string | null | undefined;
  heading?: string;
}) {
  if (!userId) return null;
  const updates = await getApprovedUpdatesForUser(userId);
  if (!updates.length) return null;

  return (
    <section className="max-w-3xl mx-auto px-6 mt-12" aria-label={heading}>
      <h2 className="font-display uppercase tracking-widest text-brand-yellow text-xs mb-4">{heading}</h2>
      <ol className="space-y-3">
        {updates.map((u) => {
          const title = u.detail.title || u.detail.new_role || "";
          return (
            <li key={u.id} className="bg-[#0d0d0d] border border-brand-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-brand-white text-sm">
                    <span className="text-brand-yellow font-display uppercase tracking-widest text-[11px] mr-2">
                      {kindLabel(u.kind)}
                    </span>
                    {title}
                  </p>
                  {[u.detail.team, u.detail.level].filter(Boolean).length > 0 && (
                    <p className="text-brand-white/40 text-xs mt-1">
                      {[u.detail.team, u.detail.level].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {u.detail.description && (
                    <p className="text-brand-white/50 text-xs mt-1 leading-relaxed">{u.detail.description}</p>
                  )}
                </div>
                <span className="text-brand-white/30 text-xs shrink-0">{u.detail.date || fmt(u.reviewed_at)}</span>
              </div>
              {u.evidence_url && (
                <a
                  href={u.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-white/30 hover:text-brand-yellow text-xs mt-2 inline-block transition-colors"
                >
                  Source ↗
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
