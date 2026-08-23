"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/client"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, GraduationCap, Folder, FolderPlus } from "lucide-react"
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

  const supabase = createClient()

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

  const fetchLocalCourses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) setCourses(data as Course[])
    setLoading(false)
  }

  useEffect(() => {
    fetchLocalCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSync = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/lms/sync", { method: "POST" })

      const text = await response.text()

      if (!response.ok) {
        const errorObj = JSON.parse(text)
        throw new Error(errorObj.error || "Server Error")
      }

      const data = JSON.parse(text)
      setCourses(data as Course[])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Sync Catch:", err)
      alert("Sync failed: " + message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">Course Folders</h2>
        </div>
        
        <div className="flex items-center gap-3">
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
        </div>
      </div>

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
            <p className="text-sm text-muted-foreground mb-4">Connect your LMS to start importing modules.</p>
            <Button onClick={handleSync} disabled={loading}>Import Now</Button>
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
              <Card className="group border-2 border-dashed transition-all cursor-pointer overflow-hidden h-40 flex items-center justify-center bg-transparent hover:bg-muted/50">
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