import { redirect } from 'next/navigation'

import { createClient } from '@/lib/server'
import { CourseList } from '@/components/ui/resource-management/CourseList'
import { ResourceHeader } from '@/components/ui/resource-management/ResourceHeader'
import { RecentlySynced } from '@/components/ui/resource-management/RecentlySynced'
import { PinnedResearch } from '@/components/ui/resource-management/PinnedResearch'
import { AllMaterials } from '@/components/ui/resource-management/AllMaterials'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pb-20 pt-8 grid grid-cols-1 lg:grid-cols-3 auto-rows-min gap-6">
      
      <div className="lg:col-span-2">
        <CourseList />
      </div>

      <div className="lg:col-span-1">
        <PinnedResearch />
      </div>

    </div>
  )
}
