import * as React from "react";
import { cn } from "@/lib/utils";

interface FrameProps extends React.HTMLAttributes<HTMLDivElement> {
  withCorners?: boolean;
  withHeader?: boolean;
  headerTitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  borderVariant?: "default" | "subtle" | "brand";
}

export const Frame = React.forwardRef<HTMLDivElement, FrameProps>(
  (
    {
      className,
      children,
      withCorners = true,
      withHeader = false,
      headerTitle,
      headerAction,
      borderVariant = "default",
      ...props
    },
    ref
  ) => {
    const borderClass = {
      default: "border-line",
      subtle: "border-line/60",
      brand: "border-brand/40",
    }[borderVariant];

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border bg-panel/80 backdrop-blur-sm transition-all",
          borderClass,
          className
        )}
        {...props}
      >
        {withCorners && (
          <>
            <span
              aria-hidden
              className="absolute -top-1.5 -left-1.5 h-3 w-3 select-none text-ink-3/40 font-mono text-[10px] leading-none pointer-events-none flex items-center justify-center"
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute -top-1.5 -right-1.5 h-3 w-3 select-none text-ink-3/40 font-mono text-[10px] leading-none pointer-events-none flex items-center justify-center"
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute -bottom-1.5 -left-1.5 h-3 w-3 select-none text-ink-3/40 font-mono text-[10px] leading-none pointer-events-none flex items-center justify-center"
            >
              +
            </span>
            <span
              aria-hidden
              className="absolute -bottom-1.5 -right-1.5 h-3 w-3 select-none text-ink-3/40 font-mono text-[10px] leading-none pointer-events-none flex items-center justify-center"
            >
              +
            </span>
          </>
        )}

        {withHeader && (
          <div className="flex items-center justify-between border-b border-line/60 px-4 py-2.5 text-xs text-ink-2 font-mono">
            <div className="flex items-center gap-2 font-medium text-ink">
              {headerTitle}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        )}

        <div>{children}</div>
      </div>
    );
  }
);
Frame.displayName = "Frame";
