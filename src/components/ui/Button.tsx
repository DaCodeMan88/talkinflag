import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, useRef } from "react";

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
      onMouseDown,
      onMouseUp,
      disabled,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLButtonElement>(null);
    // Last computed pointer-follow offset, so a mousedown/mouseup can
    // re-apply it combined with the press scale without waiting for
    // another mousemove.
    const offsetRef = useRef({ x: 0, y: 0 });
    const isPressedRef = useRef(false);

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
      if (el && !disabled && window.matchMedia("(hover: hover)").matches) {
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

    const handleDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        isPressedRef.current = true;
        applyTransform();
      }
      onMouseDown?.(e);
    };

    const handleUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      isPressedRef.current = false;
      applyTransform();
      onMouseUp?.(e);
    };

    return (
      <button
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        disabled={disabled}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onMouseDown={handleDown}
        onMouseUp={handleUp}
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
