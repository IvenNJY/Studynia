"use client"

import { useEffect, useState } from "react"
import {
  GpaProgression,
  StudyVelocity,
  ModuleProficiency,
} from '@/components/ui/performance'
import { UpcomingAssignments } from "./UpcomingAssignments"

type Analytics = {
  semesters: Array<{ id: string; semester: string; semester_order: number; gpa: number | null }>
  currentGpa: number | null
  modules: { mastered: number; reviewing: number; inProgress: number }
  assignmentsDue: number
  assignments: Array<{ id: string; title: string; due_date: string | null; points_possible: number | null }>
}

export function PerformanceDashboard() {
  const [selectedSemester, setSelectedSemester] = useState("")
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/analytics", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load performance analytics")
        return response.json() as Promise<Analytics>
      })
      .then((data) => {
        setAnalytics(data)
        setSelectedSemester(data.semesters.at(-1)?.semester ?? "")
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Failed to load analytics"))
  }, [])

  if (error) return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
  if (!analytics) return <div className="h-96 animate-pulse rounded-xl bg-muted" />

  const selectedGpa = analytics.semesters.find((semester) => semester.semester === selectedSemester)?.gpa ?? analytics.currentGpa
  const handleGpaSaved = (savedSemester: Analytics["semesters"][number]) => {
    setAnalytics((current) => {
      if (!current) return current
      const semesters = current.semesters.some((semester) => semester.id === savedSemester.id)
        ? current.semesters.map((semester) => semester.id === savedSemester.id ? savedSemester : semester)
        : [...current.semesters, savedSemester].sort((a, b) => a.semester_order - b.semester_order)
      return {
        ...current,
        semesters,
        currentGpa: semesters.at(-1)?.gpa ?? null,
      }
    })
  }

  const handleGpaDeleted = (semesterId: string) => {
    setAnalytics((current) => {
      if (!current) return current
      const semesters = current.semesters.filter((semester) => semester.id !== semesterId)
      return { ...current, semesters, currentGpa: semesters.at(-1)?.gpa ?? null }
    })
    setSelectedSemester("")
  }

  return (
    <div className="space-y-6">
      {/* Top Row: GPA and Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <GpaProgression 
            selectedSemester={selectedSemester} 
            onSelectSemester={setSelectedSemester} 
            semesters={analytics.semesters}
            currentGpa={selectedGpa}
            onSaved={handleGpaSaved}
            onDeleted={handleGpaDeleted}
          />
        </div>
        <div className="md:col-span-1">
          <StudyVelocity
            assignmentsDue={analytics.assignmentsDue}
            latestAssignment={analytics.assignments[0] ?? null}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ModuleProficiency stats={analytics.modules} />
      </div>
    </div>
  )
}