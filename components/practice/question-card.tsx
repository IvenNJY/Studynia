"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Sparkles, Download, Loader2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Toaster, toast } from "sonner"

// TODO: Make this dynamic based on user configuration
const NUM_QUESTIONS = 5
// Future implementation: Allow users to set custom num_questions
// const [customNumQuestions, setCustomNumQuestions] = useState(5)

const testTypes = ["Multiple Choice", "Flashcards", "Deep Dive"]

interface Course {
  id: string
  lms_external_id?: string | null
  course_name: string
  course_code?: string
  term?: string
}

interface CanvasFile {
  id: string | number
  display_name: string
  filename: string
  url: string
  content_type?: string
  created_at?: string
  size?: number
  source?: "lms" | "local"
}

interface ModuleMaterial {
  id: string | number
  material_id?: string
  title?: string
  name?: string
  type?: string
  url?: string
  html_url?: string
  content_type?: string
  created_at?: string
  size?: number
}

export function GenerateTestCard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL")
  const [selectedFiles, setSelectedFiles] = useState<CanvasFile[]>([])
  const [availableFiles, setAvailableFiles] = useState<CanvasFile[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [isFilesDialogOpen, setIsFilesDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTestType, setSelectedTestType] = useState(0)
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true)
        setError(null)

        const localResponse = await fetch("/api/courses", { cache: "no-store" })
        if (!localResponse.ok) throw new Error("Failed to load courses")
        const localCourses = await localResponse.json() as Array<Course & { description?: string }>
        let syncedCourses = localCourses
        try {
          const syncResponse = await fetch("/api/lms/sync", { method: "POST" })
          if (syncResponse.ok) {
            const data = await syncResponse.json() as { courses?: Array<Course & { description?: string }> } | Array<Course & { description?: string }>
            syncedCourses = Array.isArray(data) ? data : data.courses ?? localCourses
          }
        } catch {
          // Keep saved local courses available when the LMS cannot be reached.
        }
        setCourses(
          Array.from(new Map(syncedCourses.map((course) => [course.id, course])).values()).map((course) => ({
            ...course,
            term: course.term || course.description || "Unknown",
          }))
        )

        // // Extract unique semesters
        // const semesters = Array.from(
        //   new Set((data.courses || []).map((c: Course) => c.term || "Unknown"))
        // ) as string[]
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch courses"
        setError(errorMsg)
        toast.error(errorMsg)
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [])

  // Filter courses by selected semester
  const filteredCourses = useMemo(() => {
    if (!selectedSemester || selectedSemester === "ALL") return courses
    return courses.filter((c) => c.term === selectedSemester || (!c.term && selectedSemester === "Unknown"))
  }, [courses, selectedSemester])

  // Extract unique semesters
  const semesters = useMemo(() => {
    const uniqueSemesters = Array.from(
      new Set(courses.map((c) => c.term || "Unknown"))
    ) as string[]
    return uniqueSemesters.sort().reverse()
  }, [courses])

  // Fetch files for selected course
  const fetchFilesForCourse = async (course: Course) => {
    try {
      setLoadingFiles(true)
      setError(null)
      setAvailableFiles([])

      const [response, materialsResponse] = await Promise.all([
        fetch(`/api/lms/modules/${course.id}`, { cache: "no-store" }),
        fetch(`/api/materials?course_id=${encodeURIComponent(course.id)}`, { cache: "no-store" }),
      ])
      const data = response.ok
        ? await response.json() as { modules?: Array<{ items?: ModuleMaterial[] }> }
        : { modules: [] }
      const materials = materialsResponse.ok
        ? await materialsResponse.json() as Array<{ id: string; title: string; file_url: string | null; content_type: string | null; source?: string }>
        : []

      // Extract files from modules/items
      const files: CanvasFile[] = []
      if (data.modules) {
        data.modules.forEach((module) => {
          if (module.items) {
            module.items.forEach((item) => {
              // Filter for document types (PDF, PowerPoint, Word, etc.)
              if (item.type === "File" || item.material_id) {
                files.push({
                  id: item.material_id || item.id,
                  display_name: item.title || item.name || "Untitled",
                  filename: item.title || item.name || "Untitled",
                  url: item.url || item.html_url || "",
                  content_type: item.content_type,
                  created_at: item.created_at,
                  size: item.size,
                  source: item.type === "File" ? "lms" : "local",
                })
              }
            })
          }
        })
      }

      const listedMaterialIds = new Set(files.map((file) => String(file.id)))
      for (const material of materials) {
        if (!material.file_url || listedMaterialIds.has(material.id) || material.content_type === "deadline") continue
        files.push({
          id: material.id,
          display_name: material.title,
          filename: material.title,
          url: material.file_url,
          content_type: material.content_type || undefined,
          source: "local",
        })
      }

      setAvailableFiles(files)

      if (files.length === 0) {
        toast.info("No files found in this course")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch course files"
      setError(errorMsg)
      toast.error(errorMsg)
      setAvailableFiles([])
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleCourseSelect = (courseId: string) => {
    const course = filteredCourses.find((c) => c.id === courseId)
    if (course) {
      setSelectedCourse(course)
      setSelectedFiles([])
      fetchFilesForCourse(course)
    }
  }

  const handleFileToggle = (file: CanvasFile) => {
    setSelectedFiles((prev) => {
      const exists = prev.find((f) => f.id === file.id)
      if (exists) {
        return prev.filter((f) => f.id !== file.id)
      } else {
        return [...prev, file]
      }
    })
  }

  const handleGenerateAssessment = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course")
      return
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file")
      return
    }

    try {
      setIsGenerating(true)
      setError(null)

      const payload = {
        course_id: selectedCourse.id,
        title: `Assessment for ${selectedCourse.course_name}`,
        num_questions: NUM_QUESTIONS,
        // TODO: Support customization of num_questions
        // num_questions: customNumQuestions,

        // Instantly transform the Canvas API URLs into download links
        files: selectedFiles.map((file) => {
          const url = new URL(file.url)
          const canvasFile = file.source !== "local" && url.pathname.includes("/files/")
          if (canvasFile) {
            const fileId = url.pathname.match(/\/files\/(\d+)/)?.[1]
            if (fileId) url.pathname = `/files/${fileId}/download`
            url.search = "?download_frd=1"
          }
          return { filename: file.display_name || file.filename || "course-material", url: url.toString() }
        }),

        // files: selectedFiles.map((f) => ({
          
          // url: f.url,
          // filename: f.filename,
          // display_name: f.display_name,
          // content_type: f.content_type,
        // })),
        // course_id: selectedCourse.lms_external_id,
        // test_type: testTypes[selectedTestType],
      }

      // TODO: Replace with actual API endpoint for quiz generation
      // Inside GenerateTestCard.tsx -> handleGenerateAssessment

      const response = await fetch("/api/assessments/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})

      if (!response.ok) {
        const failure = await response.json() as { error?: string; details?: string }
        throw new Error(failure.details || failure.error || "Failed to start assessment generation")
      }

      const started = await response.json() as { assessmentId: string; status: "generating" }
      window.dispatchEvent(new CustomEvent("assessment-generation-started", {
        detail: {
          id: started.assessmentId,
          title: payload.title,
          created_at: new Date().toISOString(),
          status: "generating",
        },
      }))
      toast.success("Assessment generation started. You can leave Practice; we’ll notify your inbox when it’s ready.")
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate assessment"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="space-y-2 pb-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Generate New Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-driven assessment tailored to your curriculum. You can switch tabs while it generates; it will be saved when ready.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Semester Selection */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select Semester
            </p>
            <Select value={selectedSemester} onValueChange={(value) => setSelectedSemester(value ?? "")}>
              <SelectTrigger className="h-10 w-full rounded-md border-border bg-muted/35 text-sm">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Semesters</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select Course
            </p>
            <Select value={selectedCourse?.id || ""} onValueChange={(value) => { if (value) handleCourseSelect(value) }} disabled={loadingCourses}>
              <SelectTrigger className="h-10 w-full rounded-md border-border bg-muted/35 text-sm">
                <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Choose a course"} />
              </SelectTrigger>
              <SelectContent>
                {filteredCourses.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No courses available</div>
                ) : (
                  filteredCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.course_code ? `${course.course_code} - ` : ""}
                      {course.course_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* File Selection Dialog Trigger */}
          <Dialog
            open={isFilesDialogOpen} 
            onOpenChange={setIsFilesDialogOpen}>
            <DialogTrigger render={
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!isMounted || !selectedCourse || loadingFiles}
              >
                <Download className="mr-2 h-4 w-4" />
                {isMounted && selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : "Select Files for Assessment"}
              </Button>
            }>
            </DialogTrigger>

            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Select Files</DialogTitle>
                <DialogDescription>
                  Choose which files to include in the assessment generation.
                </DialogDescription>
              </DialogHeader>

              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {availableFiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        No files available in this course
                      </p>
                    ) : (
                      availableFiles.map((file) => {
                        const isSelected = selectedFiles.some((f) => f.id === file.id)
                        return (
                          <div
                            key={file.id}
                            className="max-w-xs flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleFileToggle(file)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleFileToggle(file)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.display_name}</p>
                              {file.size && (
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsFilesDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsFilesDialogOpen(false)}
                  disabled={selectedFiles.length === 0}
                >
                  Done ({selectedFiles.length})
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Test Type Selection */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Test Type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {testTypes.map((type, index) => (
                <Button
                  key={type}
                  variant={selectedTestType === index ? "default" : "outline"}
                  className={
                    selectedTestType === index
                      ? "h-10 rounded-md bg-primary text-primary-foreground"
                      : "h-10 rounded-md border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }
                  onClick={() => setSelectedTestType(index)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* TODO: Future implementation for custom num_questions
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Number of Questions
            </p>
            <div className="flex items-center gap-2">
              <Slider
                value={[customNumQuestions]}
                onValueChange={(value) => setCustomNumQuestions(value[0])}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-semibold w-12">{customNumQuestions}</span>
            </div>
          </div>
          */}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateAssessment}
            disabled={!selectedCourse || selectedFiles.length === 0 || isGenerating}
            className="h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Assessment
              </>
            )}
          </Button>``
        </CardContent>
      </Card>

      <Toaster />
    </>
  )
}
