"use client"

import React, { useState } from "react"
import { Lightbulb, Target, TrendingUp, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
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

const attempts = [
  { score: 92, title: "Data Structures: Heap Trees", meta: "3 days ago · Intermediate", action: "Review", danger: false },
  { score: 74, title: "Ethics in Machine Learning", meta: "Yesterday · Advanced", action: "Review", danger: false },
  { score: 48, title: "Derivatives (Chapter 4)", meta: "2 hours ago · Intermediate", action: "Retake", danger: true },
]

// Mock Data for the Analytics Dialog
const mockChartData = [60, 55, 70, 30, 65, 58, 78] // Last 7 attempts
const weakChapters = [
  { name: "Derivatives (Chapter 4)", score: 30, total: 100 },
]
const recentQuestions = [
  {
    q: "What is the primary purpose of the Chain Rule in Calculus?",
    userAns: "To find the derivative of a sum of functions.",
    correctAns: "To find the derivative of composite functions.",
    correct: false,
  },
  {
    q: "Which data structure uses LIFO (Last In, First Out)?",
    userAns: "Stack",
    correctAns: "Stack",
    correct: true,
  }
]

export function PerformanceSidebar() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-foreground">Recent Performance</h3>
        
        <Dialog>
          <DialogTrigger>
            <a className="cursor-pointer text-sm font-bold text-primary transition-colors hover:text-primary/80 underline-offset-4 hover:underline">
              View Full Analytics
            </a>
          </DialogTrigger>
          
          
          <DialogContent className=" border-border/70 bg-background p-0 shadow-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[80%] min-w-[60%]">

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
            <div className="p-6 overflow-y-auto bg-background flex-1">
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Select Course
                    </p>
                    <Select defaultValue="data-science">
                      <SelectTrigger className=" rounded-md border-border bg-muted/35 text-sm" >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Math-fundamentals">Math Fundamentals</SelectItem>
                        <SelectItem value="Data-science">Data Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Top Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-border/50 shadow-sm"><CardContent className="p-5"><div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Average Score</div><div className="text-4xl font-bold text-foreground">59%</div></CardContent></Card>
                    <Card className="border-border/50 shadow-sm"><CardContent className="p-5"><div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assesments Taken</div><div className="text-4xl font-bold text-foreground">12</div></CardContent></Card>
                    <Card className="border-border/50 shadow-sm"><CardContent className="p-5"><div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Study Hours</div><div className="text-4xl font-bold text-foreground">3<span className="text-xl text-muted-foreground ml-1">hrs</span></div></CardContent></Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* High-Fidelity Tailwind Bar Chart */}
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Recent Scores - Math fundamentals</CardTitle>
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
                            {mockChartData.map((val, i) => (
                              <div key={i} className="relative w-8 sm:w-10 flex flex-col justify-end group h-full">
                                {/* Tooltip */}
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[11px] py-1 px-2 rounded font-bold z-10 pointer-events-none">
                                  {val}%
                                </div>
                                {/* Bar Body */}
                                <div 
                                  className={`w-full rounded-t-sm transition-all duration-300 ${val >= 50 ? 'bg-primary/80 group-hover:bg-primary' : 'bg-destructive/60 group-hover:bg-destructive/80'}`} 
                                  style={{ height: `${val}%` }}
                                />
                              </div>
                            ))}
                          </div>

                          {/* X-Axis Labels */}
                          <div className="absolute bottom-0 left-0 right-0 flex justify-around pl-8">
                            {mockChartData.map((_, i) => (
                              <div key={i} className="text-[10px] font-bold text-muted-foreground uppercase">T{i+1}</div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Weak Chapters Focus */}
                    <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          <CardTitle className="text-lg">Target Focus Areas</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5 pt-2">
                        {weakChapters.map((chapter, i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-foreground">{chapter.name}</span>
                              <span className="font-bold text-destructive">{chapter.score}%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-destructive/10 overflow-hidden">
                              <div className="h-full bg-destructive rounded-full" style={{ width: `${chapter.score}%` }} />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "questions" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Review your mistakes</h3>
                  <div className="space-y-4">
                    {recentQuestions.map((item, idx) => (
                      <div key={idx} className="p-5 rounded-xl border border-border/60 bg-card shadow-sm">
                        <div className="flex items-start gap-3 mb-4">
                          {item.correct ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive mt-0.5" />}
                          <p className="font-medium text-foreground leading-snug">{item.q}</p>
                        </div>
                        <div className="ml-8 space-y-3">
                          {/* User Answer */}
                          <div className={`p-3 rounded-md text-sm ${item.correct ? 'bg-green-500/10 border border-green-500/20 text-green-800 dark:text-green-300' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
                            <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 opacity-80">Your Answer</span>
                            <span className="font-medium">{item.userAns}</span>
                          </div>
                          
                          {/* Correct Answer (Fixed Contrast) */}
                          {!item.correct && (
                            <div className="p-3 rounded-md text-sm bg-primary/10 border border-primary/20">
                              <span className="font-bold uppercase tracking-wider text-[10px] text-primary block mb-1">Correct Answer</span>
                              <span className="font-medium text-foreground">{item.correctAns}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sidebar List Below the Dialog Trigger */}
      <div className="space-y-3">
        {attempts.map((attempt) => (
          <Card key={attempt.title} className="border-border/60 bg-card">
            <CardContent className="flex items-center gap-3 p-3">
              <div className={attempt.danger ? "rounded-lg bg-destructive/15 px-2 py-2 text-sm font-bold text-destructive" : "rounded-lg bg-primary/15 px-2 py-2 text-sm font-bold text-primary"}>
                {attempt.score}%
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{attempt.title}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{attempt.meta}</p>
              </div>
              <Button variant={attempt.danger ? "default" : "outline"} className={attempt.danger ? "bg-primary text-primary-foreground" : ""}>
                {attempt.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/10">
        <CardHeader className="pb-2">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Lightbulb className="h-3.5 w-3.5" />
            AI Insight
          </div>
          <CardTitle className="text-xl">Adaptive Study Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            You are struggling with <span className="font-semibold text-foreground">Derivatives</span>. Based on your recent test history, we recommend reviewing <span className="font-semibold text-primary">Module 4.2: Chain Rule Applications</span> before your next attempt.
          </p>
          <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Open Module 4.2
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}