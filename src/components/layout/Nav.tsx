"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Players", href: "/players" },
  { label: "Teams", href: "/teams" },
  { label: "Podcast", href: "/podcast" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Show the Admin link only to signed-in admins
  useEffect(() => {
    let active = true;
    fetch("/api/admin/check")
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((d) => { if (active) setIsAdmin(!!d.isAdmin); })
      .catch(() => {});
    return () => { active = false; };
  }, [pathname]);

  // Sign In vs Dashboard link, based on auth state
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) setSignedIn(!!user);
    });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-brand-black/95 backdrop-blur-md border-b border-brand-yellow/20" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Logo variant="horizontal" size="sm" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "font-display text-sm tracking-widest uppercase transition-colors relative",
                    isActive
                      ? "text-brand-yellow after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-px after:bg-brand-yellow"
                      : "text-brand-white/70 hover:text-brand-yellow"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-5">
            {isAdmin && (
              <Link
                href="/admin"
                className="font-display text-sm tracking-widest uppercase text-brand-yellow/80 hover:text-brand-yellow transition-colors"
              >
                Admin
              </Link>
            )}
            <Link
              href={signedIn ? "/dashboard" : "/auth/login"}
              className="font-display text-sm tracking-widest uppercase text-brand-white/70 hover:text-brand-yellow transition-colors"
            >
              {signedIn ? "Dashboard" : "Sign In"}
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center justify-center font-display uppercase tracking-wider transition-all duration-200 px-4 py-2 text-sm border-2 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black"
            >
              Join
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-brand-white"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="md:hidden bg-brand-black border-t border-brand-yellow/20 px-4 py-6 space-y-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block font-display text-xl uppercase tracking-widest transition-colors",
                  isActive ? "text-brand-yellow" : "text-brand-white hover:text-brand-yellow"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="block font-display text-xl uppercase tracking-widest text-brand-yellow hover:text-brand-yellow/80 transition-colors"
            >
              Admin
            </Link>
          )}
          <Link
            href={signedIn ? "/dashboard" : "/auth/login"}
            className="block font-display text-xl uppercase tracking-widest text-brand-white hover:text-brand-yellow transition-colors"
          >
            {signedIn ? "Dashboard" : "Sign In"}
          </Link>
          <Link
            href="/join"
            className="block text-center font-display uppercase tracking-wider text-sm bg-brand-yellow text-brand-black px-6 py-3 mt-4 hover:bg-yellow-400 transition-colors"
          >
            Join Talkin Flag
          </Link>
        </div>
      )}
    </nav>
  );
}
