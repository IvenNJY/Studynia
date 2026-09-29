"use client"

import React, { useState } from "react"
import { CheckCircle2, XCircle, Target, BarChart3, Circle, CircleDot, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/client"

interface QuizPlayerProps {
  quiz: any[]
  assessmentId?: string // Added so we can link the attempt to the DB assessment
  onReset: () => void
}

export default function QuizPlayer({ quiz, assessmentId, onReset }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Added loading state

  const handleSelectOption = (optionLetter: string) => {
    setAnswers({ ...answers, [currentIndex]: optionLetter })
  }

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSkip = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  // Analytics Calculation
  const calculateResults = () => {
    let score = 0
    const weakPoints: string[] = []

    quiz.forEach((q, index) => {
      if (answers[index] === q.correct_answer) {
        score += 1
      } else {
        weakPoints.push(`Question ${index + 1}`)
      }
    })

    return {
      score,
      total: quiz.length,
      percentage: Math.round((score / quiz.length) * 100) || 0,
      weakPoints
    }
  }

  // Handle saving the attempt to the database
  const handleFinishTest = async () => {
    const results = calculateResults()

    // If there is no assessmentId, just show the results (fallback for testing)
    if (!assessmentId) {
      setShowResults(true)
      return
    }

    setIsSubmitting(true)
    try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
      

      const payload = {
        userId: userId, // TODO: Replace with logged-in user ID
        assessmentId: assessmentId,
        score: results.percentage,
        totalQuestions: results.total,
        correctAnswers: results.score,
        answers: quiz.map((q, idx) => ({
          question_id: q.id, // Needs to come from the DB (see Step 2 below)
          user_answer: answers[idx] || null,
          is_correct: answers[idx] === q.correct_answer
        }))
      }

      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error("Failed to save attempt data")
      }

      setShowResults(true)
    } catch (error) {
      console.error("Error saving attempt:", error)
      toast.error("Failed to save your score, but you can still view your results locally.")
      setShowResults(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!quiz || quiz.length === 0) return null

  const currentQuestion = quiz[currentIndex]
  const progressPercentage = ((currentIndex + 1) / quiz.length) * 100
  
  const isLastQuestion = currentIndex === quiz.length - 1
  const hasAnsweredAll = Object.keys(answers).length === quiz.length

  return (
    <Card className="border-border/60 bg-card shadow-sm w-full mx-auto overflow-hidden">
      {!showResults ? (
        /* View 1: Question Flow */
        <div className="space-y-6 p-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Single Choice
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">
                {currentIndex + 1} <span className="text-muted-foreground">of {quiz.length}</span>
              </span>
              <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold leading-tight text-foreground">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([letter, text]) => {
              const isSelected = answers[currentIndex] === letter

              return (
                <button
                  key={letter}
                  onClick={() => handleSelectOption(letter)}
                  className={`w-full text-left p-4 flex items-start gap-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),1)]"
                      : "border-border bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <div className="mt-0.5 text-primary shrink-0">
                    {isSelected ? (
                      <CircleDot className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className={`font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {letter}. {text as string}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-6 mt-4 border-t border-border">
            <Button 
              onClick={handlePrevious} 
              variant="outline" 
              disabled={currentIndex === 0 || isSubmitting}
              className="font-semibold"
            >
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {!isLastQuestion && (
                <Button onClick={handleSkip} variant="ghost" className="text-muted-foreground font-semibold" disabled={isSubmitting}>
                  Skip
                </Button>
              )}
              
              <div className="flex items-center gap-3">
                {isLastQuestion && !hasAnsweredAll && (
                  <span className="text-sm font-medium text-destructive mr-1">
                    *Answer all to finish
                  </span>
                )}
                
                <Button
                  onClick={isLastQuestion ? handleFinishTest : handleNext}
                  disabled={(isLastQuestion ? !hasAnsweredAll : !answers[currentIndex]) || isSubmitting}
                  className="bg-primary px-8 font-bold text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLastQuestion ? "Finish Test" : "Next Question"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View 2: Analytics Results & Explanations */
        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {(() => {
            const results = calculateResults()
            return (
              <div className="space-y-8">
                {/* Score Header */}
                <div className="text-center space-y-2 pt-4">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6 border-4 border-primary/20">
                    <span className="text-3xl font-black text-primary">{results.percentage}%</span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">Assessment Complete</h2>
                  <p className="text-muted-foreground">
                    You scored {results.score} out of {results.total} questions correctly.
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                  <Card className="bg-muted/30 border-border/50 shadow-none">
                    <CardContent className="p-6 flex flex-col justify-center h-full space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Correct Answers</p>
                          <p className="text-2xl font-bold">{results.score}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
                          <XCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Incorrect</p>
                          <p className="text-2xl font-bold">{results.total - results.score}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30 border-border/50 shadow-none">
                    <CardHeader className="p-6 pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                        <Target className="w-4 h-4" />
                        Areas to Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                      {results.weakPoints.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {results.weakPoints.map((point) => (
                            <span
                              key={point}
                              className="px-3 py-1 bg-destructive/10 text-destructive font-semibold text-xs rounded-full border border-destructive/20"
                            >
                              {point}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-600 font-medium bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                          Perfect score! No specific weak points detected in this assessment.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Review Section with Explanations */}
                <div className="pt-8 border-t border-border">
                  <h3 className="text-xl font-bold mb-6">Detailed Review</h3>
                  <div className="space-y-6">
                    {quiz.map((q, index) => {
                      const userAnswer = answers[index];
                      const isCorrect = userAnswer === q.correct_answer;

                      return (
                        <div key={index} className="p-5 rounded-xl border border-border bg-muted/20">
                          <h4 className="font-semibold text-lg mb-4 flex gap-2">
                            <span className="text-muted-foreground">{index + 1}.</span> 
                            {q.question}
                          </h4>
                          
                          <div className="grid gap-2 mb-4">
                            {Object.entries(q.options).map(([letter, text]) => {
                              const isSelected = userAnswer === letter;
                              const isActuallyCorrect = q.correct_answer === letter;
                              
                              let style = "p-3 rounded-lg border text-sm flex gap-3";
                              if (isActuallyCorrect) {
                                style += " border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 font-medium";
                              } else if (isSelected && !isActuallyCorrect) {
                                style += " border-destructive/50 bg-destructive/10 text-destructive font-medium";
                              } else {
                                style += " border-transparent bg-background/50 text-muted-foreground";
                              }

                              return (
                                <div key={letter} className={style}>
                                  <span className="font-bold">{letter}.</span>
                                  <span>{text as string}</span>
                                  {isActuallyCorrect && <CheckCircle2 className="w-4 h-4 ml-auto my-auto" />}
                                  {isSelected && !isActuallyCorrect && <XCircle className="w-4 h-4 ml-auto my-auto" />}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className={`p-4 rounded-lg mt-4 text-sm ${
                              isCorrect 
                                ? 'bg-green-500/10 text-green-800 dark:text-green-300' 
                                : 'bg-destructive/10 text-destructive-foreground'
                            }`}>
                              <p className="font-bold mb-1 flex items-center gap-2">
                                {isCorrect ? '✅ AI Explanation' : '❌ AI Explanation'}
                              </p>
                              <p className="leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-border sticky bottom-0 bg-card py-8">
                  <Button variant="outline" onClick={onReset}>
                    Generate Another Test
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentIndex(0)
                      setAnswers({})
                      setShowResults(false)
                    }}
                    className="bg-primary text-primary-foreground"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Retake Test
                  </Button>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </Card>
  )
}