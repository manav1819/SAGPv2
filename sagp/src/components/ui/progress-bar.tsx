"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  animated?: boolean;
  label?: string;
  showValue?: boolean;
  indicatorClassName?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      animated = true,
      label,
      showValue = false,
      indicatorClassName,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-2">
            {label && <span className="text-sm font-medium sagp-text-muted">{label}</span>}
            {showValue && (
              <span className="text-sm font-medium sagp-text-muted">{Math.round(percentage)}%</span>
            )}
          </div>
        )}
        <div className="sagp-progress w-full">
          <div
            className={cn(
              "sagp-progress-bar",
              indicatorClassName || "",
              animated && "duration-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
