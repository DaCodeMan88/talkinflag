import { Children, cloneElement, isValidElement } from "react";
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
 * invisibly. The spacing between copies is trailing padding on each copy
 * (not a gap on the track) so the track is exactly 2x one copy and -50%
 * lands on the seam. Respects prefers-reduced-motion via the global media query in
 * globals.css (animation-duration is forced to ~0 there).
 *
 * The second copy is aria-hidden (screen readers hear the row once) but NOT
 * `inert`: inert also blocks pointer events, and since the copies scroll past
 * each other, about half the links on screen at any moment are from the
 * second copy. That made partner links "not clickable" (Ambra, 2026-10-07).
 * Its links are taken out of the tab order instead, via `tabIndex={-1}`.
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
          "flex w-max items-center [animation:marquee_var(--marquee-duration)_linear_infinite]",
          pauseOnHover && "hover:[animation-play-state:paused]",
          className
        )}
        style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
      >
        <div className="flex items-center gap-12 pr-12 shrink-0">{children}</div>
        <div className="flex items-center gap-12 pr-12 shrink-0" aria-hidden="true">
          {Children.map(children, (child) =>
            isValidElement<{ tabIndex?: number }>(child) ? cloneElement(child, { tabIndex: -1 }) : child
          )}
        </div>
      </div>
    </div>
  );
}
