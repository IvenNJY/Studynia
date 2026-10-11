"use client"

import { useEffect, useState } from "react"
import { CalendarClock, ChevronLeft, ChevronRight, ClipboardCheck, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Assignment = {
  id: string
  title: string
  due_date: string | null
  points_possible: number | null
  is_completed: boolean
}

export function AssignmentsSummary() {
  const assignmentsPerPage = 5
  const [remaining, setRemaining] = useState<number | null>(null)
  const [dueAssignments, setDueAssignments] = useState<Assignment[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(dueAssignments.length / assignmentsPerPage)
  const pageStart = (currentPage - 1) * assignmentsPerPage
  const visibleAssignments = dueAssignments.slice(pageStart, pageStart + assignmentsPerPage)

  useEffect(() => {
    let active = true

    const loadAssignments = async () => {
      try {
        const response = await fetch("/api/assignments", { cache: "no-store" })
        if (!response.ok) return

        const assignments = (await response.json()) as Assignment[]
        if (!active || !Array.isArray(assignments)) return

        const now = Date.now()
        const dueAndIncomplete = assignments.filter((assignment) => {
          if (assignment.is_completed || !assignment.due_date) return false
          return new Date(assignment.due_date).getTime() >= now
        })

        setDueAssignments(dueAndIncomplete)
        setRemaining(dueAndIncomplete.length)
        setCurrentPage(1)
      } catch {
        if (active) setRemaining(null)
      }
    }

    loadAssignments()
    return () => {
      active = false
    }
  }, [])

  return (
    <Card className="lg:col-span-2 border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Assignments left</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {remaining === null ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading assignments" />
            ) : (
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="text-3xl font-bold leading-none">
              {remaining === null ? "—" : remaining}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              due and not completed
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {remaining === 0 && (
            <p className="text-sm text-muted-foreground">
              No incomplete assignments are due.
            </p>
          )}
          {visibleAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
                <p className="truncate text-sm font-medium">{assignment.title}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <p>
                  {assignment.due_date
                    ? new Date(assignment.due_date).toLocaleDateString()
                    : "No due date"}
                </p>
                {assignment.points_possible !== null && (
                  <p>{assignment.points_possible} pts</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                aria-label="Previous assignments page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                aria-label="Next assignments page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
