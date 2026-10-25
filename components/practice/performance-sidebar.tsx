"use client"

import React, { useState, useEffect } from "react"
import { Lightbulb, Target, TrendingUp, Clock, AlertTriangle, CheckCircle2, XCircle, Loader2, FileText, Play, Share2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/client"
import { toast } from "sonner"
import QuizPlayer from "./QuizPlayer" // <-- Ensure this path is correct for your project

type Attempt = {
  id: string
  score: number
  created_at: string
  assessments?: { title?: string | null; difficulty_level?: string | null; course_id?: string | null } | null
}

type SharedAttempt = Attempt

type AttemptMistake = {
  question: string
  topic: string | null
  userAnswer: string
  correctAnswer: string
  explanation: string | null
  options?: unknown
}

function formatAnswerChoice(answer: string, options: unknown) {
  if (!options || typeof options !== "object" || !(answer in options)) return answer
  const optionText = (options as Record<string, unknown>)[answer]
  return typeof optionText === "string" ? `${answer}. ${optionText}` : answer
}

type QuizQuestion = {
  id: string
  question: string
  options: unknown
  correct_answer: string
  explanation?: string | null
}

type PastAssessment = {
  id: string
  title: string
  created_at: string
  test_type?: string | null
  course_id?: string | null
  status?: "generating" | "ready" | "failed"
}

type CourseOption = { id: string; course_name: string; course_code?: string | null }

const ITEMS_PER_PAGE = 3

function getGenerationStatus(source: unknown): PastAssessment["status"] {
  if (typeof source !== "string") return "ready"
  try {
    const parsed = JSON.parse(source) as { status?: string }
    if (parsed.status === "generating" || parsed.status === "failed") return parsed.status
  } catch {
    // Older assessments store their source list as a JSON string.
  }
  return "ready"
}

// Helper to format dates like "2 days ago"
function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 3600) return "Just now"
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export function PerformanceSidebar({
  sharedAttempts,
  sharedUserName,
}: {
  sharedAttempts?: SharedAttempt[]
  sharedUserName?: string
}) {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([])
  const [assessments, setAssessments] = useState<PastAssessment[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [attemptSearch, setAttemptSearch] = useState("")
  const [attemptCourseId, setAttemptCourseId] = useState("all")
  const [attemptPage, setAttemptPage] = useState(1)
  const [assessmentPage, setAssessmentPage] = useState(1)
  const [stats, setStats] = useState({ avgScore: 0, totalTaken: 0 })
  const [mistakesByAttempt, setMistakesByAttempt] = useState<Record<string, AttemptMistake[]>>({})
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [shareAttempt, setShareAttempt] = useState<Attempt | null>(null)
  const [shareEmail, setShareEmail] = useState("")
  const [shareError, setShareError] = useState("")
  const [shareMessage, setShareMessage] = useState("")
  const [shares, setShares] = useState<Array<{ id: string; shared_with_id: string; profiles?: { full_name?: string | null } | null }>>([])
  const [shareLoading, setShareLoading] = useState(false)

  // Quiz Player States
  const [activeQuiz, setActiveQuiz] = useState<{ questions: QuizQuestion[], assessmentId: string } | null>(null)
  const [startingId, setStartingId] = useState<string | null>(null) // Tracks which test is currently loading
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null)

  const loadShares = async (attemptId: string) => {
    const response = await fetch(`/api/attempts/${attemptId}/share`)
    if (response.ok) setShares((await response.json()).shares || [])
  }

  const openShare = (attempt: Attempt) => {
    setShareAttempt(attempt)
    setShareEmail("")
    setShareError("")
    setShareMessage("")
    void loadShares(attempt.id)
  }

  const submitShare = async () => {
    if (!shareAttempt || !shareEmail.trim()) return
    setShareLoading(true)
    setShareError("")
    setShareMessage("")
    try {
      const response = await fetch(`/api/attempts/${shareAttempt.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to share assessment")
      setShareMessage("Assessment shared successfully.")
      setShareEmail("")
      await loadShares(shareAttempt.id)
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Failed to share assessment")
    } finally {
      setShareLoading(false)
    }
  }

  const removeShare = async (sharedWithId: string) => {
    if (!shareAttempt) return
    const response = await fetch(`/api/attempts/${shareAttempt.id}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharedWithId }),
    })
    if (response.ok) await loadShares(shareAttempt.id)
  }

  useEffect(() => {
    async function fetchPerformanceData() {
      setLoading(true)
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      
      try {
        if (!userId) return; 

        const response = await fetch(`/api/performance/${userId}`)
        if (!response.ok) throw new Error("Failed to fetch performance data")
        
        const data = await response.json()
        
        let attempts: Attempt[] = data.attempts || []
        let nextMistakesByAttempt: Record<string, AttemptMistake[]> = data.mistakesByAttempt || {}

        if (sharedAttempts?.length) {
          const sharedDetails = await Promise.all(sharedAttempts.map(async (attempt) => {
            const detailResponse = await fetch(`/api/attempts/shared/${attempt.id}`)
            if (!detailResponse.ok) throw new Error("Failed to load shared assessment")
            return detailResponse.json() as Promise<{
              attempt: Attempt
              answers: Array<{
                user_answer?: unknown
                is_correct?: boolean
                assessment_questions?: { question_text?: string | null; correct_answer?: string | null; options?: unknown; explanation?: string | null; topic?: string | null } | null
              }>
            }>
          }))
          attempts = sharedDetails.map((detail) => detail.attempt)
          nextMistakesByAttempt = Object.fromEntries(sharedDetails.map((detail) => [
            detail.attempt.id,
            detail.answers.filter((answer) => !answer.is_correct).map((answer) => ({
              question: answer.assessment_questions?.question_text || "Question unavailable",
              topic: answer.assessment_questions?.topic || null,
              userAnswer: answer.user_answer && typeof answer.user_answer === "object" && "value" in answer.user_answer
                ? String((answer.user_answer as { value?: unknown }).value)
                : "Unknown",
              correctAnswer: answer.assessment_questions?.correct_answer || "Unavailable",
              explanation: answer.assessment_questions?.explanation || null,
              options: answer.assessment_questions?.options,
            })),
          ]))
        }

        setRecentAttempts(attempts)
        setMistakesByAttempt(nextMistakesByAttempt)
        setAssessments((data.assessments || []).map((assessment: PastAssessment & { source?: unknown }) => ({
          ...assessment,
          status: getGenerationStatus(assessment.source),
        })))
        
        // Calculate Overview Stats
        const totalScores = attempts.reduce((sum, att) => sum + (att.score || 0), 0)
        
        setStats({
          avgScore: attempts.length > 0 ? Math.round(totalScores / attempts.length) : 0,
          totalTaken: attempts.length
        })

      } catch (error) {
        console.error("Error fetching performance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [sharedAttempts])

  useEffect(() => {
    let active = true
    void fetch("/api/courses", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<CourseOption[]> : [])
      .then((rows) => { if (active) setCourses(rows) })
      .catch((error) => console.error("Failed to load courses for analytics filters:", error))
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const refreshAssessments = async () => {
      const response = await fetch("/api/assessments", { cache: "no-store" })
      if (!response.ok) return
      const rows = await response.json() as Array<PastAssessment & { source?: unknown }>
      if (active) setAssessments(rows.map((assessment) => ({ ...assessment, status: getGenerationStatus(assessment.source) })))
    }
    const onGenerationStarted = (event: Event) => {
      const assessment = (event as CustomEvent<PastAssessment>).detail
      setAssessments((current) => [assessment, ...current.filter((item) => item.id !== assessment.id)])
      void refreshAssessments()
    }
    void refreshAssessments()
    const interval = window.setInterval(() => void refreshAssessments(), 5000)
    window.addEventListener("assessment-generation-started", onGenerationStarted)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener("assessment-generation-started", onGenerationStarted)
    }
  }, [])

  // Handle Starting a Past Assessment
  const handleStartAssessment = async (assessmentId: string) => {
    setStartingId(assessmentId)
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`)
      if (!response.ok) throw new Error("Failed to fetch assessment questions")
      
      const data = await response.json()
      
      // Map database schema back to what the QuizPlayer expects
      const formattedQuestions = data.questions.map((q: {
        id: string
        question_text: string
        options: unknown
        correct_answer: string
        explanation?: string | null
      }): QuizQuestion => ({
        id: q.id,
        question: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation
      }))

      setActiveQuiz({
        questions: formattedQuestions,
        assessmentId: assessmentId
      })
    } catch (error) {
      console.error("Error starting assessment:", error)
    } finally {
      setStartingId(null)
    }
  }

  const handleDeleteFailedAssessment = async (assessmentId: string) => {
    setDeletingAssessmentId(assessmentId)
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, { method: "DELETE" })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || "Failed to delete failed generation")
      setAssessments((current) => current.filter((assessment) => assessment.id !== assessmentId))
      toast.success("Failed generation deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete failed generation")
    } finally {
      setDeletingAssessmentId(null)
    }
  }

  // Derive Chart Data
  const chartData = recentAttempts.slice(0, 7).reverse().map(att => att.score || 0)
  const selectedAttempt = recentAttempts.find((attempt) => attempt.id === selectedAttemptId) || recentAttempts[0]
  const selectedAttemptMistakes = selectedAttempt ? (mistakesByAttempt[selectedAttempt.id] || []) : []
  const selectedWeakAreas = selectedAttemptMistakes.reduce<Record<string, number>>((areas, mistake) => {
    const area = mistake.topic || "Uncategorised"
    areas[area] = (areas[area] || 0) + 1
    return areas
  }, {})
  const filteredAttempts = recentAttempts.filter((attempt) => {
    const title = attempt.assessments?.title || "Unknown Assessment"
    const courseId = attempt.assessments?.course_id || ""
    const course = courses.find((item) => item.id === courseId)
    const searchText = `${title} ${course?.course_name || ""} ${course?.course_code || ""} ${new Date(attempt.created_at).toLocaleDateString()}`.toLowerCase()
    return (attemptCourseId === "all" || courseId === attemptCourseId) && searchText.includes(attemptSearch.trim().toLowerCase())
  })
  const attemptPageCount = Math.max(1, Math.ceil(filteredAttempts.length / ITEMS_PER_PAGE))
  const currentAttemptPage = Math.min(attemptPage, attemptPageCount)
  const paginatedAttempts = filteredAttempts.slice((currentAttemptPage - 1) * ITEMS_PER_PAGE, currentAttemptPage * ITEMS_PER_PAGE)
  const assessmentPageCount = Math.max(1, Math.ceil(assessments.length / ITEMS_PER_PAGE))
  const currentAssessmentPage = Math.min(assessmentPage, assessmentPageCount)
  const paginatedAssessments = assessments.slice((currentAssessmentPage - 1) * ITEMS_PER_PAGE, currentAssessmentPage * ITEMS_PER_PAGE)
  const attemptCourseOptions = [...new Set(recentAttempts.map((attempt) => attempt.assessments?.course_id).filter((courseId): courseId is string => Boolean(courseId)))].map((courseId, index) => ({
    id: courseId,
    label: courses.find((course) => course.id === courseId)?.course_name || `Course ${index + 1}`,
  }))

  return (
    <div className="space-y-6">
      {/* --- RECENT PERFORMANCE SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-semibold text-foreground">
            {sharedUserName ? `${sharedUserName}'s Performance Review` : "Recent Performance"}
          </h3>

          <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <DialogTrigger render={
              <button className="cursor-pointer text-sm font-bold text-primary transition-colors hover:text-primary/80 underline-offset-4 hover:underline">
                View Full Analytics
              </button>}>
            </DialogTrigger>

            <DialogContent className="border-border/70 bg-background p-0 shadow-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[80%] min-w-[60%]">
              <DialogHeader className="px-6 py-6 border-b border-border bg-card">
                <DialogTitle className="text-2xl font-bold">Detailed Analytics</DialogTitle>
                <DialogDescription>
                  Track your performance, identify weaknesses, and review past answers.
                </DialogDescription>
              </DialogHeader>

              {/* Custom Tab Navigation */}
              <div className="flex px-6 pt-4 gap-6 border-b border-border bg-card/50">
                <button 
                  onClick={() => setActiveTab("overview")}
                  className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  Performance Overview
                </button>
                <button 
                  onClick={() => setActiveTab("questions")}
                  className={`pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === "questions" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  Q&A Review
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="p-6 overflow-y-auto bg-background flex-1 min-h-[400px]">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : activeTab === "overview" ? (
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input value={attemptSearch} onChange={(event) => { setAttemptSearch(event.target.value); setAttemptPage(1) }} placeholder="Search attempts by title or date" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
                        </div>
                        <Select value={attemptCourseId} onValueChange={(value) => { if (value) { setAttemptCourseId(value); setAttemptPage(1) } }}>
                          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Filter by course" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All courses</SelectItem>{attemptCourseOptions.map((course) => <SelectItem key={course.id} value={course.id}>{course.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {filteredAttempts.length === 0 ? <p className="rounded-lg border p-4 text-sm text-muted-foreground">No attempts match this search and course filter.</p> : <div className="grid gap-3 sm:grid-cols-2">
                      {paginatedAttempts.map((attempt) => (
                        <button key={attempt.id} onClick={() => setSelectedAttemptId(attempt.id)} className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted ${selectedAttempt?.id === attempt.id ? "border-primary bg-primary/5" : ""}`}>
                          <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{attempt.assessments?.title || "Unknown Assessment"}</span><span className="font-bold text-primary">{attempt.score}%</span></div>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(attempt.created_at).toLocaleDateString()}</p>
                        </button>
                      ))}
                      </div>}
                      {filteredAttempts.length > 0 && <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">{filteredAttempts.length} attempt{filteredAttempts.length === 1 ? "" : "s"} · Page {currentAttemptPage} of {attemptPageCount}</p>
                        <div className="flex gap-2"><Button variant="outline" size="sm" disabled={currentAttemptPage <= 1} onClick={() => setAttemptPage((page) => Math.max(1, page - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><Button variant="outline" size="sm" disabled={currentAttemptPage >= attemptPageCount} onClick={() => setAttemptPage((page) => Math.min(attemptPageCount, page + 1))}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
                      </div>}
                    </div>
                    {selectedAttempt && <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected performance</p><h3 className="mt-1 text-lg font-bold">{selectedAttempt.assessments?.title || "Unknown Assessment"}</h3></div><div className="text-3xl font-bold text-primary">{selectedAttempt.score}%</div></div><p className="mt-2 text-sm text-muted-foreground">{selectedAttemptMistakes.length ? `${selectedAttemptMistakes.length} incorrect answer${selectedAttemptMistakes.length === 1 ? "" : "s"} identified below.` : "No weak areas found for this attempt."}</p></CardContent></Card>}
                    {selectedAttempt && <div className="space-y-3"><h3 className="text-lg font-semibold">Highlighted weak areas</h3>{Object.keys(selectedWeakAreas).length === 0 ? <p className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">Excellent work. This attempt has no recorded incorrect answers.</p> : <div className="flex flex-wrap gap-2">{Object.entries(selectedWeakAreas).map(([area, count]) => <Badge key={area} variant="destructive">{area} · {count} incorrect</Badge>)}</div>}</div>}
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-border/50 shadow-sm"><CardContent className="p-5"><div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Average Score</div><div className="text-4xl font-bold text-foreground">{stats.avgScore}%</div></CardContent></Card>
                      <Card className="border-border/50 shadow-sm"><CardContent className="p-5"><div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assessments Taken</div><div className="text-4xl font-bold text-foreground">{stats.totalTaken}</div></CardContent></Card>
                      <Card className="border-border/50 shadow-sm"><CardContent className="p-5"><div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Study Hours</div><div className="text-4xl font-bold text-foreground">-<span className="text-xl text-muted-foreground ml-1">hrs</span></div></CardContent></Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* High-Fidelity Tailwind Bar Chart */}
                      <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Recent Scores</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="relative h-56 w-full mt-4">
                            {/* Background Grid Lines & Y-Axis */}
                            <div className="absolute inset-0 flex flex-col justify-between text-[10px] font-medium text-muted-foreground/60 pb-6">
                              <div className="flex items-center w-full h-0 border-b border-border/50"><span className="-translate-y-1/2 bg-card pr-2">100</span></div>
                              <div className="flex items-center w-full h-0 border-b border-border/50"><span className="-translate-y-1/2 bg-card pr-2">75</span></div>
                              <div className="flex items-center w-full h-0 border-b border-border/50"><span className="-translate-y-1/2 bg-card pr-2">50</span></div>
                              <div className="flex items-center w-full h-0 border-b border-border/50"><span className="-translate-y-1/2 bg-card pr-2">25</span></div>
                              <div className="flex items-center w-full h-0 border-b border-border/70"><span className="-translate-y-1/2 bg-card pr-2">0</span></div>
                            </div>

                            {/* Bars */}
                            <div className="absolute inset-0 flex items-end justify-around pl-8 pb-6">
                              {chartData.map((val, i) => (
                                <div key={i} className="relative w-8 sm:w-10 flex flex-col justify-end group h-full">
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[11px] py-1 px-2 rounded font-bold z-10 pointer-events-none">
                                    {val}%
                                  </div>
                                  <div 
                                    className={`w-full rounded-t-sm transition-all duration-300 ${val >= 50 ? 'bg-primary/80 group-hover:bg-primary' : 'bg-destructive/60 group-hover:bg-destructive/80'}`} 
                                    style={{ height: `${val}%` }}
                                  />
                                </div>
                              ))}
                            </div>

                            {/* X-Axis Labels */}
                            <div className="absolute bottom-0 left-0 right-0 flex justify-around pl-8">
                              {chartData.map((_, i) => (
                                <div key={i} className="text-[10px] font-bold text-muted-foreground uppercase">T{i+1}</div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">Review your mistakes</h3>
                        <p className="text-sm text-muted-foreground">{selectedAttempt ? `${selectedAttempt.assessments?.title || "Unknown Assessment"} · ${new Date(selectedAttempt.created_at).toLocaleDateString()}` : "Select an attempt to review its answers."}</p>
                      </div>
                      {recentAttempts.length > 0 && <Select value={selectedAttempt?.id || ""} onValueChange={(value) => value && setSelectedAttemptId(value)}>
                        <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select an attempt" /></SelectTrigger>
                        <SelectContent>{recentAttempts.map((attempt) => <SelectItem key={attempt.id} value={attempt.id}>{attempt.assessments?.title || "Unknown Assessment"} · {new Date(attempt.created_at).toLocaleDateString()}</SelectItem>)}</SelectContent>
                      </Select>}
                    </div>
                    <div className="space-y-4">
                      {!selectedAttempt ? (
                        <p className="text-muted-foreground text-sm">No attempt selected.</p>
                      ) : selectedAttemptMistakes.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No mistakes recorded for this attempt. Great job!</p>
                      ) : (
                        selectedAttemptMistakes.map((item, idx) => {
                          return (
                            <div key={idx} className="p-5 rounded-xl border border-border/60 bg-card shadow-sm">
                              <div className="flex items-start gap-3 mb-4">
                                <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                                <p className="font-medium text-foreground leading-snug">{item.question}</p>
                              </div>
                              <div className="ml-8 space-y-3">
                                <div className="p-3 rounded-md text-sm bg-destructive/10 border border-destructive/20 text-destructive">
                                  <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 opacity-80">Your Answer</span>
                                  <span className="font-medium">{formatAnswerChoice(item.userAnswer, item.options)}</span>
                                </div>
                                <div className="p-3 rounded-md text-sm bg-primary/10 border border-primary/20">
                                  <span className="font-bold uppercase tracking-wider text-[10px] text-primary block mb-1">Correct Answer</span>
                                  <span className="font-medium text-foreground">{formatAnswerChoice(item.correctAnswer || "Unavailable", item.options)}</span>
                                </div>
                                <div className="p-3 rounded-md text-sm bg-muted/60 border border-border/60"><span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground block mb-1">Explanation</span><p className="text-foreground">{item.explanation || "No explanation was saved for this question."}</p></div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sidebar List Below the Dialog Trigger */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading history...</div>
          ) : recentAttempts.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">No recent attempts.</div>
          ) : (
            recentAttempts.slice(0, 3).map((attempt) => {
              const isDanger = attempt.score < 50
              const title = attempt.assessments?.title || "Unknown Assessment"
              const difficulty = attempt.assessments?.difficulty_level ? "Intermediate" : "Standard"
              
              return (
                <Card key={attempt.id} className="border-border/60 bg-card">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className={isDanger ? "rounded-lg bg-destructive/15 px-2 py-2 text-sm font-bold text-destructive" : "rounded-lg bg-primary/15 px-2 py-2 text-sm font-bold text-primary"}>
                      {attempt.score}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {timeAgo(attempt.created_at)} · {difficulty}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant={isDanger ? "default" : "outline"} className={isDanger ? "bg-primary text-primary-foreground" : ""} onClick={() => { setSelectedAttemptId(attempt.id); setActiveTab("overview"); setAnalyticsOpen(true) }}>
                        Show analytics
                      </Button>
                      {!sharedUserName && (
                        <Button variant="ghost" size="icon" aria-label={`Share ${title}`} onClick={() => openShare(attempt)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* --- READY TO PRACTICE SECTION --- */}
      {!sharedUserName && <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-semibold text-foreground">Past Assessments</h3>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading assessments...</div>
          ) : assessments.length === 0 ? (
            <p className="text-sm px-1 leading-relaxed text-muted-foreground">
              You haven&apos;t generated any assessments yet. Select a course and generate one to get started!
            </p>
          ) : (
            paginatedAssessments.map((assessment) => (
              <Card key={assessment.id} className="border-border/60 bg-card">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">
                      {assessment.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {assessment.status === "generating" && <><Loader2 className="h-3 w-3 animate-spin" /> Generating</>}
                      {assessment.status === "failed" && "Generation failed"}
                      {(!assessment.status || assessment.status === "ready") && `${timeAgo(assessment.created_at)} · ${assessment.test_type || "Assessment"}`}
                    </p>
                  </div>
                  {assessment.status === "failed" ? <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete failed generation ${assessment.title}`}
                    title="Delete failed generation"
                    onClick={() => void handleDeleteFailedAssessment(assessment.id)}
                    disabled={deletingAssessmentId === assessment.id}
                  >
                    {deletingAssessmentId === assessment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button> : assessment.status === "generating" ? null : <Button
                    variant="outline" 
                    className="shrink-0 gap-1.5 px-3"
                    onClick={() => handleStartAssessment(assessment.id)}
                    disabled={startingId === assessment.id}
                  >
                    {startingId === assessment.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                    Start
                  </Button>}
                </CardContent>
              </Card>
            ))
          )}
          {!loading && assessments.length > ITEMS_PER_PAGE && <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">{assessments.length} assessments · Page {currentAssessmentPage} of {assessmentPageCount}</p>
            <div className="flex gap-2"><Button variant="outline" size="sm" disabled={currentAssessmentPage <= 1} onClick={() => setAssessmentPage((page) => Math.max(1, page - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><Button variant="outline" size="sm" disabled={currentAssessmentPage >= assessmentPageCount} onClick={() => setAssessmentPage((page) => Math.min(assessmentPageCount, page + 1))}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
          </div>}
        </div>
      </div>}

      {/* Quiz Player Modal Overlay */}
      <Dialog 
        open={!!activeQuiz} 
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveQuiz(null);
        }}
      >
        <DialogContent className="max-w-[95vw] md:max-w-5xl lg:max-w-6xl max-h-[90vh] h-[90vh] overflow-y-auto p-0 border-none bg-white shadow-none">
          {activeQuiz && (
            <QuizPlayer 
              quiz={activeQuiz.questions} 
              assessmentId={activeQuiz.assessmentId} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareAttempt} onOpenChange={(open) => !open && setShareAttempt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share assessment results</DialogTitle>
            <DialogDescription>
              Allow another StudyNia user to view the results for {shareAttempt?.assessments?.title || "this assessment"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={shareEmail}
                onChange={(event) => setShareEmail(event.target.value)}
                placeholder="person@example.com"
                className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                onKeyDown={(event) => event.key === "Enter" && void submitShare()}
              />
              <Button onClick={() => void submitShare()} disabled={shareLoading || !shareEmail.trim()}>
                {shareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
              </Button>
            </div>
            {shareError && <p className="text-sm text-destructive">{shareError}</p>}
            {shareMessage && <p className="text-sm text-primary">{shareMessage}</p>}
            <div className="space-y-2">
              <p className="text-sm font-semibold">People with access</p>
              {shares.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not shared with anyone yet.</p>
              ) : shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{share.profiles?.full_name || "StudyNia user"}</span>
                  <Button variant="ghost" size="icon" aria-label="Remove access" onClick={() => void removeShare(share.shared_with_id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
