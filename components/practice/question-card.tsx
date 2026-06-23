import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const options = [
  {
    title: "Supervised learning uses labeled training data.",
    body: "It requires a ground truth dataset to train the algorithm to map inputs to specific outputs, whereas unsupervised learning finds hidden structures in unlabeled data.",
    selected: true,
  },
  {
    title: "Unsupervised learning requires more pre-processing.",
    body: "It focuses exclusively on categorical data and requires human intervention to define the clusters before the model can begin training.",
    selected: false,
  },
  {
    title: "Supervised learning is faster but less accurate.",
    body: "It relies on simple linear regressions while unsupervised learning uses deep neural networks to automatically label data from scratch.",
    selected: false,
  },
]

export function QuestionCard() {
  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Current Progress
          </span>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Question 4 of 12</span>
            <div className="h-2 w-32 rounded-full bg-muted">
              <div className="h-2 w-1/3 rounded-full bg-primary" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold leading-snug text-foreground">
          Explain the fundamental difference between supervised and unsupervised learning in the context of data labeling.
        </h2>

        <div className="space-y-3">
          {options.map((option) => (
            <div
              key={option.title}
              className={
                option.selected
                  ? "rounded-xl border border-primary/50 bg-primary/10 p-4"
                  : "rounded-xl border border-border bg-muted/30 p-4"
              }
            >
              <p className="font-medium text-foreground">{option.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{option.body}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" className="text-muted-foreground">
            Skip for now
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Next Question</Button>
        </div>
      </CardContent>
    </Card>
  )
}
