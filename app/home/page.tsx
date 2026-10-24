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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const metadataName = typeof user.user_metadata.full_name === 'string'
    ? user.user_metadata.full_name.trim()
    : typeof user.user_metadata.name === 'string'
      ? user.user_metadata.name.trim()
      : ''
  const displayName = profile?.full_name?.trim() || metadataName || data.claims.email || user.email || 'User'

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-foreground">Welcome Back! {displayName}
        👋
      </h1>
      {/* Interactive Client-Driven Dashboard Grid */}
      <PerformanceDashboard />
    </div>
  )
}
