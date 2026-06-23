import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const testTypes = ["Multiple Choice", "Flashcards", "Deep Dive"]

export function GenerateTestCard() {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="space-y-2 pb-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl">Generate New Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-driven assessment tailored to your curriculum.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select Source
            </p>
            <Select defaultValue="data-science">
              <SelectTrigger className="h-10 w-full rounded-md border-border bg-muted/35 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data-science">Data Science</SelectItem>
                <SelectItem value="algorithms">Algorithms</SelectItem>
                <SelectItem value="systems">Computer Systems</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Test Type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {testTypes.map((type, index) => (
                <Button
                  key={type}
                  variant={index === 0 ? "default" : "outline"}
                  className={
                    index === 0
                      ? "h-10 rounded-md bg-primary text-primary-foreground"
                      : "h-10 rounded-md border-border bg-muted/20 text-muted-foreground"
                  }
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Difficulty Level</p>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              Intermediate
            </span>
          </div>

          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 w-2/3 rounded-full bg-primary" />
          </div>

          <div className="mt-3 grid grid-cols-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Standard</span>
            <span className="text-center">Comprehensive</span>
            <span className="text-right">Advanced</span>
          </div>
        </div>

        <Button className="h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate AI Assessment
        </Button>
      </CardContent>
    </Card>
  )
}
