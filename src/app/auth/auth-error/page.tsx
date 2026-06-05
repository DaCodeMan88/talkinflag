import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="font-display text-3xl uppercase text-brand-white">Sign In Error</h1>
        <p className="text-brand-white/50 text-sm leading-relaxed">
          Something went wrong with the sign-in link. It may have expired or already been used.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-4 bg-brand-yellow text-brand-black font-display uppercase tracking-widest text-sm py-3 px-6 hover:bg-brand-yellow/90 transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
