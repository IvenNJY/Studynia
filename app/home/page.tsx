import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { StudyHabitInsight } from '@/components/ui/performance'
import { PerformanceDashboard } from '@/components/ui/performance/PerformanceDashboard' // Our new client wrapper

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-foreground">Welcome Back! {data.claims.user_metadata.preferred_username || data.claims.email} 
        👋
      </h1>
      {/* Interactive Client-Driven Dashboard Grid */}
      <PerformanceDashboard />
    </div>
  )
}