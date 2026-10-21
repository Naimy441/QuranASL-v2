import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "brand" | "accent" | "ghost";
  size?: "sm" | "default";
}

export function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-brand text-brand-ink hover:bg-brand/90",
    secondary: "border-border/60 bg-secondary/80 text-secondary-foreground hover:bg-secondary",
    outline: "border-line text-ink-2 hover:bg-panel-2",
    brand: "border-brand/20 bg-brand-soft/70 text-brand font-medium",
    accent: "border-accent/30 bg-accent-soft/70 text-accent font-medium",
    ghost: "border-transparent text-ink-3 hover:text-ink hover:bg-panel-2",
  }[variant];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-mono",
    default: "px-2.5 py-0.5 text-xs font-medium",
  }[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles,
        sizeStyles,
        className
      )}
      {...props}
    />
  );
}
