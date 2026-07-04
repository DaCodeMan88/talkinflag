import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/eval/admin-client";
import MessageActions from "./MessageActions";

export const dynamic = "force-dynamic";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
  archived_at: string | null;
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (!(await getAdminUser())) redirect("/");
  const { view } = await searchParams;
  const showArchived = view === "archived";
  const supabase = createAdminClient();

  let query = supabase
    .from("contact_submissions")
    .select("id, name, email, subject, message, created_at, is_read, archived_at")
    .order("created_at", { ascending: false })
    .limit(200);

  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  const { data } = await query;
  const messages = (data ?? []) as Message[];
  const unread = showArchived ? 0 : messages.filter((m) => !m.is_read).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="border-l-4 border-[#FDDD58] pl-6 mb-8">
        <Link href="/admin" className="text-white/40 text-xs hover:text-white transition-colors">← Admin</Link>
        <h1 className="font-display text-4xl uppercase text-white leading-none mt-1">Messages</h1>
        <p className="text-white/40 mt-2 text-sm">
          {showArchived
            ? "Archived contact-form messages"
            : unread === 0
            ? "Inbox — all caught up"
            : `Inbox — ${unread} unread`}
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6 text-xs font-display uppercase tracking-widest">
        <Link
          href="/admin/messages"
          className={!showArchived ? "text-[#FDDD58]" : "text-white/40 hover:text-white"}
        >
          Inbox
        </Link>
        <Link
          href="/admin/messages?view=archived"
          className={showArchived ? "text-[#FDDD58]" : "text-white/40 hover:text-white"}
        >
          Archived
        </Link>
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`border p-5 transition-colors ${
              m.is_read || showArchived
                ? "bg-[#0d0d0d] border-white/10"
                : "bg-[#0d0d0d] border-[#FDDD58]/40"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!m.is_read && !showArchived && (
                    <span className="w-2 h-2 rounded-full bg-[#FDDD58] shrink-0" aria-label="unread" />
                  )}
                  <span className="text-white font-semibold text-sm">{m.name}</span>
                  <span className="text-white/30 text-xs">
                    &lt;<a href={`mailto:${m.email}`} className="hover:text-[#FDDD58]">{m.email}</a>&gt;
                  </span>
                </div>
                <p className="text-[#FDDD58] text-xs font-display uppercase tracking-widest mt-1">{m.subject}</p>
              </div>
              <span className="text-white/25 text-xs shrink-0">{timeAgo(m.created_at)}</span>
            </div>

            <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed border-t border-white/5 pt-3 mt-2">
              {m.message}
            </p>

            <div className="flex items-center justify-between mt-4">
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject + " — Talkin Flag")}`}
                className="text-[#FDDD58] text-[11px] font-display uppercase tracking-widest hover:underline"
              >
                Reply →
              </a>
              <MessageActions id={m.id} isRead={m.is_read} archived={!!m.archived_at} />
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-white/30 text-sm py-12 text-center">
            {showArchived ? "No archived messages." : "No messages yet."}
          </p>
        )}
      </div>
    </div>
  );
}
