import { Sparkles } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function PracticeHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Assessment Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Validate your understanding through AI-generated retrieval practice.
        </p>
      </div>

      
    </div>
  )
}
