import { redirect } from 'next/navigation'

import { createClient } from '@/lib/server'
import {
  GpaProgression,
  StudyVelocity,
  CourseGradeProgress,
  ModuleProficiency,
  StudyHabitInsight,
} from '@/components/ui/performance'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pt-4">
      {/* Top Row: GPA and Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <GpaProgression />
        </div>
        <div className="md:col-span-1">
          <StudyVelocity />
        </div>
      </div>

      {/* Middle Row: Progress and Proficiency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CourseGradeProgress />
        <ModuleProficiency />
      </div>

      {/* Bottom Row: Insights */}
      <div>
        <StudyHabitInsight />
      </div>
    </div>
  )
}
