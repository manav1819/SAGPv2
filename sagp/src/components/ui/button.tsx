"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "sagp-btn",
  {
    variants: {
      variant: {
        primary: "sagp-btn-primary",
        secondary: "sagp-btn-secondary",
        destructive: "sagp-btn-danger",
        ghost: "sagp-btn-ghost",
        outline: "sagp-btn-secondary",
      },
      size: {
        sm: "sagp-btn-sm",
        md: "",
        lg: "sagp-btn-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={loading || disabled}
      ref={ref}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = "Button";

export { Button, buttonVariants };
