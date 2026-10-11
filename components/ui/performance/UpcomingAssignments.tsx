import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarClock } from "lucide-react"

type Assignment = { id: string; title: string; due_date: string | null; points_possible: number | null }

export function UpcomingAssignments({
  assignments,
  assignmentsDue,
}: {
  assignments: Assignment[]
  assignmentsDue: number
}) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Assignments due</CardTitle>
        <p className="text-sm text-muted-foreground">
          {assignmentsDue} incomplete assignment{assignmentsDue === 1 ? "" : "s"} due.
        </p>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No incomplete assignments are due.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
                  <p className="truncate text-sm font-medium">{assignment.title}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No due date"}</p>
                  {assignment.points_possible !== null && <p>{assignment.points_possible} pts</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
