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

      <Card className="border-primary/30 bg-primary/10">
        <CardContent className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Weekly Goal: 85% Complete
        </CardContent>
      </Card>
    </div>
  )
}
