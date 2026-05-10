"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "sagp-badge",
  {
    variants: {
      variant: {
        // Risk tiers
        low: "sagp-badge-green",
        medium: "sagp-badge-warning",
        high: "sagp-badge-danger",
        critical: "sagp-badge-danger",
        // General purpose
        default: "",
        primary: "",
        secondary: "sagp-badge-purple",
        destructive: "sagp-badge-danger",
        success: "sagp-badge-green",
        warning: "sagp-badge-warning",
        info: "",
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
