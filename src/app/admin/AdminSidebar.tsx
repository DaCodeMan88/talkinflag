"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { group: string; items: { label: string; href: string }[] }[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Members", href: "/admin/members" },
    ],
  },
  {
    group: "Database",
    items: [
      { label: "Players", href: "/admin/players" },
      { label: "Coaches", href: "/admin/coaches" },
      { label: "Scouts", href: "/admin/scouts" },
      { label: "TF Rankings", href: "/admin/rankings" },
      { label: "Featured Athlete", href: "/admin/featured" },
    ],
  },
  {
    group: "Review Queues",
    items: [
      { label: "Claims", href: "/admin/claims" },
      { label: "Change Requests", href: "/admin/change-requests" },
      { label: "Verifications", href: "/admin/verifications" },
      { label: "Highlights", href: "/admin/highlights" },
      { label: "Events", href: "/admin/events" },
      { label: "Career Updates", href: "/admin/credentials" },
      { label: "Reports", href: "/admin/reports" },
    ],
  },
  {
    group: "Inbox",
    items: [{ label: "Messages", href: "/admin/messages" }],
  },
];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto pb-6">
      {NAV.map((group) => (
        <div key={group.group}>
          <p className="text-white/25 text-[10px] font-display uppercase tracking-widest px-4 pt-5 pb-1">
            {group.group}
          </p>
          {group.items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`block px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-l-2 border-[#FDDD58] bg-white/5 text-[#FDDD58]"
                    : "border-l-2 border-transparent text-white/50 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const header = (
    <div className="px-4 py-4 border-b border-white/10">
      <Link href="/admin" className="font-display text-[#FDDD58] uppercase tracking-widest text-sm">
        Talkin Flag
      </Link>
      <p className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5">Admin</p>
    </div>
  );

  const footer = (
    <div className="px-4 py-4 border-t border-white/10">
      <Link href="/" className="text-white/40 text-xs hover:text-white transition-colors">
        ← Back to site
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/10 sticky top-20 h-[calc(100vh-5rem)]">
        {header}
        <NavList pathname={pathname} />
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="lg:hidden sticky top-16 md:top-20 z-40 bg-black border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="font-display text-[#FDDD58] uppercase tracking-widest text-sm">
          Talkin Flag Admin
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="text-white/70 hover:text-white p-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-black border-r border-white/10 flex flex-col">
            <div className="flex items-center justify-between pr-2">
              {header}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="text-white/50 hover:text-white p-2"
              >
                ✕
              </button>
            </div>
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
