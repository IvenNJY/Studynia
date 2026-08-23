"use client"

import { useState } from "react"
import {
  GpaProgression,
  StudyVelocity,
  CourseGradeProgress,
  ModuleProficiency,
} from '@/components/ui/performance'

// --- Hardcoded Semester Data Map ---
const SEMESTER_DATA = {
  "SEM 1": {
    gpa: 3.2,
    modules: { mastered: 8, reviewing: 4, inProgress: 3 },
    courses: [
      { name: "Intro to Programming", progress: 85 },
      { name: "Calculus I", progress: 70 },
      { name: "English Composition", progress: 90 },
    ],
  },
  "SEM 2": {
    gpa: 3.5,
    modules: { mastered: 14, reviewing: 6, inProgress: 5 },
    courses: [
      { name: "Object Oriented Programming", progress: 88 },
      { name: "Calculus II", progress: 65 },
      { name: "Physics I", progress: 75 },
    ],
  },
  "SEM 3": {
    gpa: 3.7,
    modules: { mastered: 18, reviewing: 10, inProgress: 6 },
    courses: [
      { name: "Data Structures", progress: 92 },
      { name: "Discrete Math", progress: 80 },
      { name: "Database Systems", progress: 60 },
    ],
  },
  "SEM 4": {
    gpa: 3.88,
    modules: { mastered: 24, reviewing: 12, inProgress: 8 },
    courses: [
      { name: "Operating Systems", progress: 10 },
      { name: "Data Structures & Algorithms", progress: 20 },
      { name: "Psychology", progress: 90 },
    ],
  },
}

export function PerformanceDashboard() {
  const [selectedSemester, setSelectedSemester] = useState("SEM 4")
  
  // Safeguard fallback lookup
  const currentData = SEMESTER_DATA[selectedSemester as keyof typeof SEMESTER_DATA] || SEMESTER_DATA["SEM 4"]

  return (
    <div className="space-y-6">
      {/* Top Row: GPA and Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <GpaProgression 
            selectedSemester={selectedSemester} 
            onSelectSemester={setSelectedSemester} 
            currentGpa={currentData.gpa}
          />
        </div>
        <div className="md:col-span-1">
          <StudyVelocity />
        </div>
      </div>

      {/* Middle Row: Progress and Proficiency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CourseGradeProgress courses={currentData.courses} />
        <ModuleProficiency stats={currentData.modules} />
      </div>
    </div>
  )
}