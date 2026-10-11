import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ModuleProficiency({ stats }: { 
  stats: { mastered: number, reviewing: number, inProgress: number } 
}) {
  const segments = [
    { label: "Mastered", value: stats.mastered, color: "hsl(var(--chart-1))" },
    { label: "Reviewing", value: stats.reviewing, color: "hsl(var(--chart-2))" },
    { label: "In progress", value: stats.inProgress, color: "hsl(var(--chart-3))" },
  ]
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  let offset = 0
  const gradient = total === 0
    ? "hsl(var(--muted)) 0 100%"
    : segments.map((segment) => {
      const start = (offset / total) * 100
      offset += segment.value
      return `${segment.color} ${start}% ${(offset / total) * 100}%`
    }).join(", ")

  return (
    <Card className="shadow-none border-border/50 border bg-muted/30 sm:p-2 h-full flex flex-col">
      <CardHeader className="pb-6">
        <CardTitle className="text-[1.1rem] font-medium text-foreground">
          Module Proficiency
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-8 flex items-center justify-center rounded-full bg-muted/30 text-center">
            <div>
              <div className="text-2xl font-black text-foreground">{total}</div>
              <div className="text-[10px] font-bold tracking-wider text-muted-foreground">MATERIALS</div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-xs space-y-3">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                {segment.label}
              </span>
              <span className="font-semibold text-foreground">{segment.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}