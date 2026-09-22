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
 *
 * The duration is passed through as a `--marquee-duration` custom property
 * (set via inline `style`) rather than an inline `animation` shorthand.
 * Inline styles win over selector-based rules regardless of specificity, so
 * an inline `animation` would make `hover:[animation-play-state:paused]`
 * inert — hovering would never actually pause the track. Declaring the real
 * `animation` in a class (which reads the custom property) keeps the hover
 * variant at matching specificity, so Tailwind's later `:hover` rule wins.
 */
export function Marquee({ children, className, durationSeconds = 30, pauseOnHover = true }: MarqueeProps) {
  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          "flex w-max items-center gap-12 [animation:marquee_var(--marquee-duration)_linear_infinite]",
          pauseOnHover && "hover:[animation-play-state:paused]",
          className
        )}
        style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
      >
        <div className="flex items-center gap-12 shrink-0">{children}</div>
        <div className="flex items-center gap-12 shrink-0" inert aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
