"use client"

import { useEffect, useState, type FormEvent } from "react"
import { CalendarClock, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, Plus } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

type Assignment = {
  id: string
  title: string
  due_date: string | null
  points_possible: number | null
  is_completed: boolean
}

type Course = {
  id: string
  course_name: string
  course_code?: string | null
}

export function AssignmentsSummary() {
  const assignmentsPerPage = 5
  const [remaining, setRemaining] = useState<number | null>(null)
  const [dueAssignments, setDueAssignments] = useState<Assignment[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [courses, setCourses] = useState<Course[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [courseId, setCourseId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [points, setPoints] = useState("")

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

    fetch("/api/courses", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load courses")
        const data = await response.json() as Course[]
        if (active && Array.isArray(data)) setCourses(data)
      })
      .catch((error: unknown) => console.error("Failed to load courses for assignments:", error))

    return () => {
      active = false
    }
  }, [])

  const handleAddAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !courseId) return

    setSaving(true)
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          course_id: courseId,
          due_date: dueDate || null,
          points_possible: points ? Number(points) : null,
        }),
      })
      const payload = await response.json() as Assignment & { error?: string }
      if (!response.ok) throw new Error(payload.error || "Could not add assignment")

      if (payload.due_date && !payload.is_completed && new Date(payload.due_date).getTime() >= Date.now()) {
        setDueAssignments((previous) => [...previous, payload].sort((left, right) =>
          new Date(left.due_date ?? "").getTime() - new Date(right.due_date ?? "").getTime()
        ))
        setRemaining((previous) => previous === null ? previous : previous + 1)
      }
      setTitle("")
      setCourseId("")
      setDueDate("")
      setPoints("")
      setShowAddForm(false)
      toast.success("Assignment added.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add assignment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="lg:col-span-2 border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">Assignments left</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} disabled={courses.length === 0}>
            <Plus /> Add assignment
          </Button>
        </div>
        {courses.length === 0 && (
          <p className="text-xs text-muted-foreground">Add a course before creating an assignment.</p>
        )}
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

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add assignment</DialogTitle>
            <DialogDescription>Enter assignment details and choose one of your courses.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAssignment} className="space-y-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Assignment title"
              aria-label="Assignment title"
              required
            />
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              aria-label="Course"
              required
            >
              <option value="" disabled>Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}{course.course_code ? ` (${course.course_code})` : ""}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-muted-foreground">
                Due date
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                Points
                <Input type="number" min="0" step="any" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="Optional" />
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !title.trim() || !courseId}>
                {saving ? "Saving…" : "Save assignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
