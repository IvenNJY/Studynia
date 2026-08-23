"use client"

import React, { useState } from "react"
import { Sparkles, CheckCircle2, XCircle, Target, BarChart3, CheckSquare, Square, Circle, CircleDot } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
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

// Extended question data with different formats and metadata
const quizData = [
  {
    id: "q1",
    type: "mcq",
    topic: "Data Labeling",
    question: "Explain the fundamental difference between supervised and unsupervised learning in the context of data labeling.",
    options: [
      { id: "a", title: "Supervised learning uses labeled training data.", body: "It requires a ground truth dataset to train the algorithm to map inputs to specific outputs." },
      { id: "b", title: "Unsupervised learning requires more pre-processing.", body: "It focuses exclusively on categorical data and requires human intervention." },
      { id: "c", title: "Supervised learning is faster but less accurate.", body: "It relies on simple linear regressions while unsupervised learning uses deep neural networks." },
    ],
    correctAnswer: "a"
  },
  {
    id: "q2",
    type: "true_false",
    topic: "Model Evaluation",
    question: "A high training accuracy and a remarkably low validation accuracy usually indicate that the machine learning model is underfitting.",
    options: [
      { id: "true", title: "True", body: "The model hasn't learned the basic patterns of the data." },
      { id: "false", title: "False", body: "This scenario actually indicates overfitting, where the model memorizes the training data." }
    ],
    correctAnswer: "false"
  },
  {
    id: "q3",
    type: "multi_select",
    topic: "Neural Networks",
    question: "Which of the following are commonly used activation functions in deep learning? (Select all that apply)",
    options: [
      { id: "relu", title: "ReLU", body: "Rectified Linear Unit" },
      { id: "sigmoid", title: "Sigmoid", body: "Maps values between 0 and 1" },
      { id: "tfidf", title: "TF-IDF", body: "Term Frequency-Inverse Document Frequency" },
      { id: "tanh", title: "Tanh", body: "Hyperbolic Tangent" }
    ],
    correctAnswers: ["relu", "sigmoid", "tanh"]
  }
]

const testTypes = ["Multiple Choice", "Flashcards", "Deep Dive"]

export function GenerateTestCard() {
  const [selectedType, setSelectedType] = useState("Multiple Choice")
  const [difficulty, setDifficulty] = useState([66])
  
  // Quiz State
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [showResults, setShowResults] = useState(false)

  const getDifficultyLabel = (val: number) => {
    if (val < 33) return "Standard"
    if (val < 67) return "Intermediate"
    return "Advanced"
  }

  // Reset quiz when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setTimeout(() => {
        setCurrentIndex(0)
        setAnswers({})
        setShowResults(false)
      }, 300) // wait for animation
    }
  }

  const handleSelectOption = (questionId: string, optionId: string, type: string) => {
    if (type === "multi_select") {
      const currentSelections = answers[questionId] || []
      if (currentSelections.includes(optionId)) {
        setAnswers({ ...answers, [questionId]: currentSelections.filter((id: string) => id !== optionId) })
      } else {
        setAnswers({ ...answers, [questionId]: [...currentSelections, optionId] })
      }
    } else {
      setAnswers({ ...answers, [questionId]: optionId })
    }
  }

  const handleNext = () => {
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setShowResults(true)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  // Analytics Calculation
  const calculateResults = () => {
    let score = 0
    const weakTopics = new Set<string>()

    quizData.forEach((q) => {
      const userAns = answers[q.id]
      
      if (q.type === "mcq" || q.type === "true_false") {
        if (userAns === q.correctAnswer) {
          score += 1
        } else {
          weakTopics.add(q.topic)
        }
      } else if (q.type === "multi_select") {
        const isCorrect = userAns && 
          userAns.length === q.correctAnswers.length && 
          q.correctAnswers.every((ans) => userAns.includes(ans))
        
        if (isCorrect) {
          score += 1
        } else {
          weakTopics.add(q.topic)
        }
      }
    })

    return {
      score,
      total: quizData.length,
      percentage: Math.round((score / quizData.length) * 100),
      weakTopics: Array.from(weakTopics)
    }
  }

  const currentQuestion = quizData[currentIndex]
  const progressPercentage = ((currentIndex + 1) / quizData.length) * 100

  return (
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
        {/* Settings Form - Exact Same as Your Original */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select Source
            </p>
            <Select defaultValue="data-science">
              <SelectTrigger className="h-10 w-full rounded-md border-border bg-muted/35 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AI">AI</SelectItem>
                <SelectItem value="algorithms">Algorithms</SelectItem>
                <SelectItem value="systems">Computer Systems</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Test Type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {testTypes.map((type) => (
                <Button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  variant={selectedType === type ? "default" : "outline"}
                  className={`h-10 px-2 text-[11px] sm:text-xs rounded-md transition-all ${
                    selectedType === type
                      ? "bg-primary text-primary-foreground"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-medium">Difficulty Level</p>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary transition-all">
              {getDifficultyLabel(difficulty[0])}
            </span>
          </div>
              
          <Slider
            value={difficulty}
            onValueChange={setDifficulty}
            max={100}
            step={1}
            className="cursor-pointer"
          />

          <div className="mt-4 grid grid-cols-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            <span>Standard</span>
            <span className="text-center">Comp.</span>
            <span className="text-right">Advanced</span>
          </div>
        </div>

        {/* Dialog Assessment Overlay */}
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger  className="h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform active:scale-[0.98]">
            <a className="flex items-center justify-center gap-2 w-full h-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Assessment
            </a>
          </DialogTrigger>

          <DialogContent className="min-w-[60%] border-border/70 bg-card p-0 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>Assessment</DialogTitle>
              <DialogDescription>Question view</DialogDescription>
            </DialogHeader>

            {/* View 1: Question Flow */}
            {!showResults ? (
              <div className="space-y-6 p-8">
                {/* Progress Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {currentQuestion.type === "multi_select" ? "Select All That Apply" : "Single Choice"}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">{currentIndex + 1} <span className="text-muted-foreground">of {quizData.length}</span></span>
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

                {/* Options List */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = currentQuestion.type === "multi_select"
                      ? (answers[currentQuestion.id] || []).includes(option.id)
                      : answers[currentQuestion.id] === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(currentQuestion.id, option.id, currentQuestion.type)}
                        className={`w-full text-left p-4 flex items-start gap-4 rounded-xl border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),1)]"
                            : "border-border bg-muted/20 hover:bg-muted/40"
                        }`}
                      >
                        <div className="mt-0.5 text-primary">
                          {currentQuestion.type === "multi_select" ? (
                            isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            isSelected ? <CircleDot className="w-5 h-5" /> : <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className={`font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {option.title}
                          </p>
                          {option.body && (
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {option.body}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button onClick={handleSkip} variant="ghost" className="text-muted-foreground font-semibold">
                    Skip
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id] || answers[currentQuestion.id].length === 0}
                    className="bg-primary px-8 font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    {currentIndex === quizData.length - 1 ? "Finish Test" : "Next Question"}
                  </Button>
                </div>
              </div>
            ) : (
              /* View 2: Analytics Results */
              <div className="p-8">
                {(() => {
                  const results = calculateResults();
                  return (
                    <div className="space-y-8">
                      <div className="text-center space-y-2 pt-4">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6 border-4 border-primary/20">
                          <span className="text-3xl font-black text-primary">{results.percentage}%</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Assessment Complete</h2>
                        <p className="text-muted-foreground">
                          You scored {results.score} out of {results.total} questions correctly.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 pt-4">
                        {/* Summary Card */}
                        <Card className="bg-muted/30 border-border/50">
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

                        {/* Weak Points Card */}
                        <Card className="bg-muted/30 border-border/50">
                          <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                              <Target className="w-4 h-4" />
                              Areas to Review
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 pt-2">
                            {results.weakTopics.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {results.weakTopics.map(topic => (
                                  <span key={topic} className="px-3 py-1 bg-destructive/10 text-destructive font-semibold text-xs rounded-full border border-destructive/20">
                                    {topic}
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

                      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                          Return to Dashboard
                        </Button>
                        <Button 
                          onClick={() => {
                            setCurrentIndex(0);
                            setAnswers({});
                            setShowResults(false);
                          }}
                          className="bg-primary text-primary-foreground"
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Retake Test
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}