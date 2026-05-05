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
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-slate-800 px-3 py-2 text-base text-slate-100 placeholder-slate-500 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-red-500 focus-visible:ring-red-500"
            : "border-slate-700 hover:border-slate-600",
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
        <p className="mt-2 text-sm text-slate-400">{helperText}</p>
      )}
    </div>
  )
);

Input.displayName = "Input";

export { Input };
