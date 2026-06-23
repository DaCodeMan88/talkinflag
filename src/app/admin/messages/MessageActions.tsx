"use client";

import { useTransition } from "react";
import { setRead, setArchived } from "./actions";

export default function MessageActions({
  id,
  isRead,
  archived,
}: {
  id: string;
  isRead: boolean;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={pending}
        onClick={() => startTransition(() => setRead(id, !isRead))}
        className="text-white/40 text-[11px] font-display uppercase tracking-widest hover:text-[#FDDD58] transition-colors disabled:opacity-50"
      >
        {isRead ? "Mark unread" : "Mark read"}
      </button>
      <span className="text-white/15">·</span>
      <button
        disabled={pending}
        onClick={() => startTransition(() => setArchived(id, !archived))}
        className="text-white/40 text-[11px] font-display uppercase tracking-widest hover:text-[#FDDD58] transition-colors disabled:opacity-50"
      >
        {archived ? "Restore" : "Archive"}
      </button>
    </div>
  );
}
