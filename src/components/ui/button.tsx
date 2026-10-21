import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "glow";
  size?: "default" | "sm" | "lg" | "icon" | "xs";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default:
        "bg-brand text-brand-ink hover:bg-brand-2 shadow-xs active:scale-[0.99] border border-black/10 dark:border-white/10",
      destructive:
        "bg-bad text-white hover:bg-bad/90 shadow-xs active:scale-[0.99]",
      outline:
        "border border-line bg-panel text-ink hover:bg-panel-2 hover:border-line-2 shadow-xs active:scale-[0.99]",
      secondary:
        "bg-panel-2 text-ink hover:bg-panel-2/80 border border-line/60 shadow-xs active:scale-[0.99]",
      ghost: "text-ink-2 hover:bg-panel-2 hover:text-ink active:scale-[0.99]",
      link: "text-brand underline-offset-4 hover:underline p-0 h-auto",
      glow: "bg-brand text-brand-ink hover:bg-brand-2 shadow-lg shadow-brand/20 active:scale-[0.99] border border-brand/30",
    }[variant];

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-sm",
      xs: "h-7 px-2.5 text-xs rounded-md",
      sm: "h-8 px-3 text-xs rounded-md",
      lg: "h-11 px-6 text-sm font-medium rounded-lg",
      icon: "h-9 w-9 p-0",
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
