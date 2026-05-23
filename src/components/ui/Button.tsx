import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-display uppercase tracking-wider transition-all duration-200 active:not(:disabled):scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
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
