"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // Risk tiers
        low: "bg-green-900/30 text-green-300 border border-green-700/50",
        medium: "bg-yellow-900/30 text-yellow-300 border border-yellow-700/50",
        high: "bg-orange-900/30 text-orange-300 border border-orange-700/50",
        critical: "bg-red-900/30 text-red-300 border border-red-700/50",
        // General purpose
        default: "bg-slate-700 text-slate-100",
        primary: "bg-teal-900/30 text-teal-300 border border-teal-700/50",
        secondary: "bg-slate-700/50 text-slate-300 border border-slate-600/50",
        destructive: "bg-red-900/30 text-red-300 border border-red-700/50",
        success: "bg-green-900/30 text-green-300 border border-green-700/50",
        warning: "bg-yellow-900/30 text-yellow-300 border border-yellow-700/50",
        info: "bg-blue-900/30 text-blue-300 border border-blue-700/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
