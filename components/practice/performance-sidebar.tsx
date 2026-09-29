"use client"

import React, { useState, useEffect } from "react"
import { Lightbulb, Target, TrendingUp, Clock, AlertTriangle, CheckCircle2, XCircle, Loader2, FileText, Play } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
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
import QuizPlayer from "./QuizPlayer" // <-- Ensure this path is correct for your project

// Helper to format dates like "2 days ago"
function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 3600) return "Just now"
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export function PerformanceSidebar() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [mistakes, setMistakes] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [stats, setStats] = useState({ avgScore: 0, totalTaken: 0 })

  // Quiz Player States
  const [activeQuiz, setActiveQuiz] = useState<{ questions: any[], assessmentId: string } | null>(null)
  const [startingId, setStartingId] = useState<string | null>(null) // Tracks which test is currently loading

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
        
        setRecentAttempts(data.attempts || [])
        setMistakes(data.mistakes || [])
        setAssessments(data.assessments || []) 
        
        // Calculate Overview Stats
        const attempts = data.attempts || []
        const totalScores = attempts.reduce((sum: number, att: any) => sum + (att.score || 0), 0)
        
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
  }, [])

  // Handle Starting a Past Assessment
  const handleStartAssessment = async (assessmentId: string) => {
    setStartingId(assessmentId)
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`)
      if (!response.ok) throw new Error("Failed to fetch assessment questions")
      
      const data = await response.json()
      
      // Map database schema back to what the QuizPlayer expects
      const formattedQuestions = data.questions.map((q: any) => ({
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

  // Derive Chart Data
  const chartData = recentAttempts.slice(0, 7).reverse().map(att => att.score || 0)

  return (
    <div className="space-y-6">
      {/* --- RECENT PERFORMANCE SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-semibold text-foreground">Recent Performance</h3>

          <Dialog>
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
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Course</p>
                      <Select defaultValue="all">
                        <SelectTrigger className="rounded-md border-border bg-muted/35 text-sm" >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                    <h3 className="text-lg font-semibold">Review your mistakes</h3>
                    <div className="space-y-4">
                      {mistakes.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No mistakes recorded yet! Great job.</p>
                      ) : (
                        mistakes.map((item, idx) => {
                          const question = item.assessment_questions?.question_text
                          const correctAns = item.assessment_questions?.correct_answer
                          const userAnsObj = item.user_answer as { value?: string }
                          const userAnsText = userAnsObj?.value || "Unknown"

                          return (
                            <div key={idx} className="p-5 rounded-xl border border-border/60 bg-card shadow-sm">
                              <div className="flex items-start gap-3 mb-4">
                                <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                                <p className="font-medium text-foreground leading-snug">{question}</p>
                              </div>
                              <div className="ml-8 space-y-3">
                                <div className="p-3 rounded-md text-sm bg-destructive/10 border border-destructive/20 text-destructive">
                                  <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 opacity-80">Your Answer</span>
                                  <span className="font-medium">{userAnsText}</span>
                                </div>
                                <div className="p-3 rounded-md text-sm bg-primary/10 border border-primary/20">
                                  <span className="font-bold uppercase tracking-wider text-[10px] text-primary block mb-1">Correct Answer</span>
                                  <span className="font-medium text-foreground">{correctAns}</span>
                                </div>
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
                    <Button variant={isDanger ? "default" : "outline"} className={isDanger ? "bg-primary text-primary-foreground" : ""}>
                      {isDanger ? "Retake" : "Review"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* --- READY TO PRACTICE SECTION --- */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-semibold text-foreground">Past Assessments</h3>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading assessments...</div>
          ) : assessments.length === 0 ? (
            <p className="text-sm px-1 leading-relaxed text-muted-foreground">
              You haven't generated any assessments yet. Select a course and generate one to get started!
            </p>
          ) : (
            assessments.map((assessment) => (
              <Card key={assessment.id} className="border-border/60 bg-card">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">
                      {assessment.title}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {timeAgo(assessment.created_at)} · {assessment.test_type}
                    </p>
                  </div>
                  
                  <Button 
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
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

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
              onReset={() => setActiveQuiz(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}