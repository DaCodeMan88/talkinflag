import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, useCallback, useEffect, useRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      children,
      onMouseMove,
      onMouseLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      disabled,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLButtonElement>(null);
    // Last computed pointer-follow offset, so a pointerdown/pointerup can
    // re-apply it combined with the press scale without waiting for
    // another mousemove.
    const offsetRef = useRef({ x: 0, y: 0 });
    const isPressedRef = useRef(false);
    // Lazily-created MediaQueryLists, reused across every mousemove instead
    // of re-querying matchMedia on each one. Created lazily (inside a
    // handler, not at render time) because `window` doesn't exist during
    // SSR.
    const hoverMqlRef = useRef<MediaQueryList | null>(null);
    const reducedMotionMqlRef = useRef<MediaQueryList | null>(null);

    // Both the magnetic offset and the "pressed" scale are written to the
    // SAME inline style.transform on every change. Inline styles always
    // win over the stylesheet, so if the press-scale lived only in a CSS
    // class (e.g. `active:enabled:scale-95`) it would be silently
    // overridden by whatever translate() this handler last wrote — the
    // button would visibly stop "pressing in" the moment the mouse had
    // moved at least once. Combining them here keeps a single source of
    // truth for the transform.
    const applyTransform = () => {
      const el = innerRef.current;
      if (!el) return;
      const { x, y } = offsetRef.current;
      const scale = isPressedRef.current ? " scale(0.95)" : "";
      el.style.transform = `translate(${x}px, ${y}px)${scale}`;
    };

    const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = innerRef.current;
      if (!hoverMqlRef.current) hoverMqlRef.current = window.matchMedia("(hover: hover)");
      if (!reducedMotionMqlRef.current) {
        reducedMotionMqlRef.current = window.matchMedia("(prefers-reduced-motion: reduce)");
      }
      // Reduced motion skips the JS-driven pointer-follow translate
      // specifically — it bypasses CSS entirely (unlike the press-scale
      // and color/transition classes, which are already zeroed globally
      // by the prefers-reduced-motion block in globals.css), so it needs
      // its own explicit check here, same reasoning as useCountUp.ts.
      if (
        el &&
        !disabled &&
        hoverMqlRef.current.matches &&
        !reducedMotionMqlRef.current.matches
      ) {
        const rect = el.getBoundingClientRect();
        offsetRef.current = {
          x: (e.clientX - rect.left - rect.width / 2) * 0.15,
          y: (e.clientY - rect.top - rect.height / 2) * 0.3,
        };
        applyTransform();
      }
      onMouseMove?.(e);
    };

    const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      isPressedRef.current = false;
      offsetRef.current = { x: 0, y: 0 };
      if (innerRef.current) innerRef.current.style.transform = "";
      onMouseLeave?.(e);
    };

    // Press-state tracking uses Pointer Events (not mouse events) so it
    // survives a touch drag that starts on the button and lifts off it.
    // setPointerCapture on pointerdown guarantees pointerup/pointercancel
    // for this pointerId are delivered to THIS element regardless of where
    // the finger physically lifts — a plain onMouseUp/onTouchEnd would
    // never fire in that case (the synthetic mouseup targets whatever is
    // under the finger when it lifts, which may not be the button), which
    // is exactly how isPressedRef could get stuck `true` and leave the
    // button rendered at scale(0.95) forever.
    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled) {
        isPressedRef.current = true;
        applyTransform();
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      onPointerDown?.(e);
    };

    const releasePress = (e: React.PointerEvent<HTMLButtonElement>) => {
      isPressedRef.current = false;
      applyTransform();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
      releasePress(e);
      onPointerUp?.(e);
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
      releasePress(e);
      onPointerCancel?.(e);
    };

    // Belt-and-suspenders on top of pointer capture: if a pointerup or
    // pointercancel anywhere in the window fires while we still think
    // we're pressed (e.g. a browser with imperfect pointer-capture
    // support), clear the press state unconditionally rather than trust
    // capture alone.
    useEffect(() => {
      const resetPress = () => {
        if (!isPressedRef.current) return;
        isPressedRef.current = false;
        const el = innerRef.current;
        if (el) {
          const { x, y } = offsetRef.current;
          el.style.transform = `translate(${x}px, ${y}px)`;
        }
      };
      window.addEventListener("pointerup", resetPress);
      window.addEventListener("pointercancel", resetPress);
      return () => {
        window.removeEventListener("pointerup", resetPress);
        window.removeEventListener("pointercancel", resetPress);
      };
    }, []);

    // A disabled button stops receiving mouse/pointer events in
    // Chrome/Firefox the instant the `disabled` attribute is applied — so
    // if the user hovered first (setting a translate offset) then clicked
    // to submit and the button disabled mid-interaction, no mouseleave/
    // pointerup ever fires to clear it, and the inline transform is stuck
    // for the whole disabled/loading window. Watch `disabled` directly and
    // reset regardless of any pointer event.
    useEffect(() => {
      if (!disabled) return;
      isPressedRef.current = false;
      offsetRef.current = { x: 0, y: 0 };
      if (innerRef.current) innerRef.current.style.transform = "";
    }, [disabled]);

    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    return (
      <button
        ref={setRefs}
        disabled={disabled}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={cn(
          "inline-flex items-center justify-center font-display uppercase tracking-wider transition-[background-color,color,transform] duration-200 ease-out active:enabled:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-brand-yellow text-brand-black hover:bg-yellow-400": variant === "primary",
            "border-2 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-brand-black": variant === "outline",
            "text-brand-yellow hover:text-yellow-400": variant === "ghost",
          },
          {
            "px-4 py-2 text-sm": size === "sm",
            "px-6 py-3 text-base": size === "md",
            "px-8 py-4 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
