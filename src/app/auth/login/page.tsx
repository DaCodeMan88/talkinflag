import { buildMetadata } from "@/lib/seo";
import LoginForm from "./LoginForm";

export const metadata = buildMetadata({
  title: "Sign In | Talkin Flag",
  description: "Sign in to claim your player profile on Talkin Flag.",
  path: "/auth/login",
});

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string; claimCoach?: string }>;
}) {
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-24 pb-20">
      <div className="max-w-md w-full">
        <div className="border-l-4 border-brand-yellow pl-6 mb-10">
          <h1 className="font-display text-4xl uppercase text-brand-white leading-none">
            Sign In
          </h1>
          <p className="text-brand-white/50 mt-3 text-sm leading-relaxed">
            Use your email or Google to access your Talkin Flag account.
          </p>
        </div>

        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  );
}
