"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-linear-to-r from-slate-700 via-slate-600 to-slate-700",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
