"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    value?: number
    indicatorclass?: string
    max?: number
  }
>(({ className, value = 0, max = 100, indicatorclass, ...props }, ref) => {
  const clampedValue = Math.max(0, Math.min(value, max))
  const width = `${(clampedValue / max) * 100}%`

  return (
    <div
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all", indicatorclass)}
        style={{ width }}
      />
    </div>
  )
})

Progress.displayName = "Progress"

export { Progress }