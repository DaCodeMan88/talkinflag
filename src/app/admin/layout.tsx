import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
          ← Back to site
        </Link>
        <span className="text-white/20">|</span>
        <span className="font-display text-[#FDDD58] text-sm tracking-widest uppercase">
          Admin
        </span>
      </nav>
      <main>{children}</main>
    </div>
  );
}
