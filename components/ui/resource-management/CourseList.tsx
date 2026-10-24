"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, GraduationCap, Folder, FolderPlus, RefreshCw, Settings } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface Course {
  id: string
  course_name?: string
  course_code?: string
  description?: string
  created_at?: string
}

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSemester, setSelectedSemester] = useState("All")
  const [hasSetInitialSemester, setHasSetInitialSemester] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourseName, setNewCourseName] = useState("")
  const [newCourseSemester, setNewCourseSemester] = useState("")

  const semesters = useMemo(() => {
    const terms = courses.map((c) => c.description || "Unknown Term")
    return Array.from(new Set(terms)).sort()
  }, [courses])

  useEffect(() => {
    if (semesters.length > 0 && !hasSetInitialSemester) {
      setSelectedSemester(semesters[semesters.length - 1])
      setHasSetInitialSemester(true)
    }
  }, [semesters, hasSetInitialSemester])

  const filteredCourses = useMemo(() => {
    if (selectedSemester === "All") return courses
    return courses.filter((c) => (c.description || "Unknown Term") === selectedSemester)
  }, [courses, selectedSemester])

  const fetchLocalCourses = async (shouldSync = false) => {
    setLoading(true)
    try {
      const response = await fetch("/api/courses", { cache: "no-store" })
      const payload = await response.json() as Course[] | { error?: string; details?: string }
      if (!response.ok || !Array.isArray(payload)) {
        const errorPayload = !Array.isArray(payload) ? payload : {}
        throw new Error(
          errorPayload.error
            ? `${errorPayload.error}${errorPayload.details ? ` (${errorPayload.details})` : ""}`
            : "Failed to load courses"
        )
      }

      setCourses(payload)
      if (shouldSync) {
        await handleSync()
      }
    } catch (error) {
      console.error("Failed to load courses:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load courses")
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchLocalCourses(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSync = async () => {
    setLoading(true)
    setSyncing(true)
    const toastId = toast.loading("Syncing courses and assignments…")

    try {
      const response = await fetch("/api/lms/sync", { method: "POST" })

      const text = await response.text()
      let payload: unknown = null
      try {
        payload = text ? JSON.parse(text) : null
      } catch {
        throw new Error(`The sync endpoint returned an invalid response (${response.status}).`)
      }

      if (!response.ok) {
        const errorMessage = payload && typeof payload === "object" && "error" in payload
          ? String(payload.error)
          : "Server Error"
        const details = payload && typeof payload === "object" && "details" in payload
          ? ` (${String(payload.details)})`
          : ""
        throw new Error(response.status === 404 ? "No active LMS connection found. Connect your LMS first." : `${errorMessage}${details}`)
      }

      const data = payload as { courses?: Course[] } | Course[]
      const syncedCourses = Array.isArray(data) ? data : data.courses ?? []
      setCourses((previous) => {
        if (syncedCourses.length === 0) return previous
        const merged = new Map(previous.map((course) => [course.id, course]))
        for (const course of syncedCourses) merged.set(course.id, course)
        return Array.from(merged.values()).sort((left, right) =>
          (right.created_at ?? "").localeCompare(left.created_at ?? "")
        )
      })
      toast.success(
        syncedCourses.length === 0
          ? "Sync complete. Your saved courses are still available."
          : "Sync complete.",
        { id: toastId }
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Sync Catch:", err)
      toast.error(message === "Invalid token" ? message : `Sync failed: ${message}`, { id: toastId })
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_name: newCourseName,
          description: newCourseSemester,
        }),
      })
      const payload = await response.json() as Course & { error?: string; details?: string }
      if (!response.ok) throw new Error(`${payload.error || "Could not add the course."}${payload.details ? ` (${payload.details})` : ""}`)
      setCourses((previous) => [payload, ...previous])
      setNewCourseName("")
      setNewCourseSemester("")
      setShowAddCourse(false)
      toast.success("Course added.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the course.")
    }
  }

  return (
    <div className="space-y-6 pt-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">Course Folders</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {courses.length > 0 && (
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="flex h-8 w-full sm:w-auto items-center justify-between rounded-md border-0 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground shadow-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="All">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={handleSync} disabled={loading || syncing} className="gap-2 cursor-pointer">
            <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {syncing ? "Syncing..." : "Sync LMS"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddCourse((visible) => !visible)} className="gap-2 cursor-pointer">
            <FolderPlus className="h-4 w-4" />
            Add course
          </Button>
        </div>
      </div>

      <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add course</DialogTitle>
            <DialogDescription>Add a course folder to organize your materials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={newCourseName}
              onChange={(event) => setNewCourseName(event.target.value)}
              placeholder="Course name"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
            <input
              value={newCourseSemester}
              onChange={(event) => setNewCourseSemester(event.target.value)}
              placeholder="Semester (e.g. Fall 2026)"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCourse(false)}>Cancel</Button>
            <Button onClick={handleAddCourse} disabled={!newCourseName.trim() || loading}>Save course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className=" border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm text-muted-foreground mb-4">Add a course locally or connect your LMS to import courses and assignments.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setShowAddCourse(true)}>Add a course</Button>
              <Link href="/settings" className={buttonVariants({ variant: "outline" })}><Settings className="mr-2 h-4 w-4" />Connect LMS</Link>
            </div>
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium">No courses match this filter</p>
            <Button variant="ghost" onClick={() => setSelectedSemester("All")} className="mt-4">
              Clear Filter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {filteredCourses.map((course) => (
              <CarouselItem key={course.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Link href={`/folders/${course.id}`}>
                  <Card className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden border shadow-sm bg-card h-40">
                    <CardContent className="p-5 flex flex-col h-full justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-4">
                          <Folder className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors" title={course.course_name}>
                          {course.course_name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-4 line-clamp-1">
                          {course.course_code || course.description || "Course"}
                        </p>
                      </div>
                    
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
            <CarouselItem className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
              <Card
                className="group border-2 border-dashed transition-all cursor-pointer overflow-hidden h-40 flex items-center justify-center bg-transparent hover:bg-muted/50"
                onClick={() => setShowAddCourse(true)}
              >
                <CardContent className="p-5 flex flex-col items-center justify-center h-full gap-2">
                  <FolderPlus className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Add Course</span>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex left-0 -translate-x-1/2 bg-background shadow-md border" />
          <CarouselNext className="hidden md:flex right-0 translate-x-1/2 bg-background shadow-md border" />
        </Carousel>
      )}
    </div>
  )
}
