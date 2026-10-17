import { redirect } from 'next/navigation'

import { createClient } from '@/lib/server'
import { ProfileCard } from '@/components/user-settings/profile-card'
// import { WorkspaceAesthetic } from '@/components/user-settings/workspace-aesthetic'
import { LmsIntegration } from '@/components/user-settings/lms-integration'
import { PersonalInformation } from '@/components/user-settings/personal-information'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, institution_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
  const fullName = profile?.full_name || (typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '')
  const metadataAvatar = typeof user.user_metadata.avatar_url === 'string'
    ? user.user_metadata.avatar_url
    : typeof user.user_metadata.picture === 'string'
      ? user.user_metadata.picture
      : null

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between pb-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        </div>
        
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <LmsIntegration />
          </div>
          
          <div className="space-y-8">
            <ProfileCard fullName={fullName} avatarUrl={profile?.avatar_url || metadataAvatar} />
            {/* <WorkspaceAesthetic /> */}
          </div>
        </div>

        {/* Bottom Section */}
        <PersonalInformation
          fullName={fullName}
          institutionName={profile?.institution_name || ''}
        />
      </div>
    </div>
  )
}
