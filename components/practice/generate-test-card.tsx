"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Sparkles, Download, Loader2, AlertCircle } from "lucide-react"
import QuizPlayer from "./QuizPlayer"

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
  lms_external_id: string
  course_name: string
  course_code?: string
  term?: string
}

interface CanvasFile {
  id: number
  display_name: string
  filename: string
  url: string
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
  const [activeQuiz, setActiveQuiz] = useState<{ quiz: any[]; assessmentId: string } | null>(null)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
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

        const response = await fetch("/api/lms/sync", { method: "POST" })

        if (!response.ok) {
          throw new Error("Failed to fetch courses")
        }
        
        const text = await response.text()
        const data = JSON.parse(text) as { courses?: Array<Course & { description?: string }> } | Array<Course & { description?: string }>
        const syncedCourses: Array<Course & { description?: string }> = Array.isArray(data) ? data : data.courses ?? []
        setCourses(
          syncedCourses.map((course) => ({
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

      // Fetch Canvas files for the course
      const response = await fetch(`/api/lms/modules/${course.id}`, { cache: "no-store" })

      if (!response.ok) {
        throw new Error("Failed to fetch course files")
      }

      const data = await response.json()

      // Extract files from modules/items
      const files: CanvasFile[] = []
      if (data.modules) {
        data.modules.forEach((module: any) => {
          if (module.items) {
            module.items.forEach((item: any) => {
              // Filter for document types (PDF, PowerPoint, Word, etc.)
              if (
                item.type === "File" 
                // &&
                // (item.content_type?.includes("pdf") ||
                //   item.content_type?.includes("powerpoint") ||
                //   item.content_type?.includes("word") ||
                //   item.content_type?.includes("document"))
              ) {
                files.push({
                  id: item.id,
                  display_name: item.title || item.name || "Untitled",
                  filename: item.title || item.name || "Untitled",
                  url: item.url || item.html_url || "",
                  content_type: item.content_type,
                  created_at: item.created_at,
                  size: item.size,
                })
              }
            })
          }
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
        num_questions: NUM_QUESTIONS,
        // TODO: Support customization of num_questions
        // num_questions: customNumQuestions,

        // Instantly transform the Canvas API URLs into download links
        files: selectedFiles.map(f => {
          const domain = new URL(f.url).hostname;
          const fileId = f.url.split('/').pop();
          
          return {
            filename: f.display_name || f.filename || "lecture.pdf", // Ensure you pass a filename!
            url: `https://${domain}/files/${fileId}/download?download_frd=1`
          };
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

      const response = await fetch("/api/assessments/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})

if (!response.ok) {
  throw new Error("Failed to generate assessment")
}

const result = await response.json()

const dbResponse = await fetch("/api/assessments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    courseId: selectedCourse.id,
    title: `Assessment for ${selectedCourse.course_name}`,
    testType: testTypes[selectedTestType],
    sourceList: result.source_list,
    quiz: result.quiz
  })
})

if (!dbResponse.ok) {
  throw new Error("Assessment generated, but failed to save to database.")
}

const dbData = await dbResponse.json()
toast.success("Assessment generated and saved successfully!")

// Pass the assessmentId to the QuizPlayer so it can log attempts later
      setActiveQuiz({
        quiz: result.quiz,
        assessmentId: dbData.assessmentId,
      })
      setIsQuizModalOpen(true)
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
            AI-driven assessment tailored to your curriculum.
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
            <Select value={selectedSemester} 
                    onValueChange={(value) => setSelectedSemester(value ?? "")}>
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
            <Select 
                value={selectedCourse?.id || ""} 
                onValueChange={(value) => {
                  if (value) handleCourseSelect(value);
                }} 
                disabled={loadingCourses || filteredCourses.length === 0}
              >
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
          </Button>
        </CardContent>
      </Card>

      <Dialog 
        open={!!activeQuiz} 
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveQuiz(null);
        }}
      >
        {/* We use max-w-4xl for a nice wide quiz, and max-h screen with overflow for scrolling */}
        <DialogContent className="max-w-[95vw] md:max-w-5xl lg:max-w-6xl max-h-[90vh] h-[90vh] overflow-y-auto p-0 border-none bg-white shadow-none">
          {/* We only render the QuizPlayer if activeQuiz is not null */}
          {activeQuiz && (
            <QuizPlayer 
              quiz={activeQuiz.quiz}
              assessmentId={activeQuiz.assessmentId}
              onReset={() => setActiveQuiz(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  )
}
