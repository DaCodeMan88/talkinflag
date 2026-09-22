import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  durationSeconds?: number;
  pauseOnHover?: boolean;
}

/**
 * Infinite horizontal ticker. Pass a single row of children — this renders
 * it twice back-to-back and animates a -50% translate so the loop seams
 * invisibly. Respects prefers-reduced-motion via the global media query in
 * globals.css (animation-duration is forced to ~0 there).
 */
export function Marquee({ children, className, durationSeconds = 30, pauseOnHover = true }: MarqueeProps) {
  return (
    <div className="overflow-hidden" role="list">
      <div
        className={cn("flex w-max items-center gap-12", pauseOnHover && "hover:[animation-play-state:paused]", className)}
        style={{ animation: `marquee ${durationSeconds}s linear infinite` }}
      >
        <div className="flex items-center gap-12 shrink-0">{children}</div>
        <div className="flex items-center gap-12 shrink-0" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
