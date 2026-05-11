"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium sagp-text-muted">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "sagp-input",
          error
            ? "border-red-500 focus-visible:ring-red-500"
            : "",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <div className="flex items-center gap-1 mt-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm sagp-text-muted">{helperText}</p>
      )}
    </div>
  )
);

Input.displayName = "Input";

export { Input };
