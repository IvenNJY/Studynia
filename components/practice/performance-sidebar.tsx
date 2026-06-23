import { Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const attempts = [
  {
    score: 92,
    title: "Data Structures: Heap Trees",
    meta: "3 days ago · Intermediate",
    action: "Review",
    danger: false,
  },
  {
    score: 74,
    title: "Ethics in Machine Learning",
    meta: "Yesterday · Advanced",
    action: "Review",
    danger: false,
  },
  {
    score: 48,
    title: "Backpropagation Theory",
    meta: "2 hours ago · Intermediate",
    action: "Retake",
    danger: true,
  },
]

export function PerformanceSidebar() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-foreground">Recent Performance</h3>
        <button className="text-sm font-medium text-primary hover:text-primary/80">View Analytics</button>
      </div>

      <div className="space-y-3">
        {attempts.map((attempt) => (
          <Card key={attempt.title} className="border-border/60 bg-card">
            <CardContent className="flex items-center gap-3 p-3">
              <div
                className={
                  attempt.danger
                    ? "rounded-lg bg-destructive/15 px-2 py-2 text-sm font-bold text-destructive"
                    : "rounded-lg bg-primary/15 px-2 py-2 text-sm font-bold text-primary"
                }
              >
                {attempt.score}%
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{attempt.title}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {attempt.meta}
                </p>
              </div>

              <Button
                variant={attempt.danger ? "default" : "outline"}
                className={attempt.danger ? "bg-primary text-primary-foreground" : ""}
              >
                {attempt.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/10">
        <CardHeader className="pb-2">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Lightbulb className="h-3.5 w-3.5" />
            AI Insight
          </div>
          <CardTitle className="text-xl">Adaptive Study Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            You are struggling with <span className="font-semibold text-foreground">Backpropagation</span>. Based on your recent test history, we recommend reviewing <span className="font-semibold text-primary">Module 4.2: Chain Rule Applications</span> before your next attempt.
          </p>

          <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Open Module 4.2
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
