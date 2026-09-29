import { GenerateTestCard, PerformanceSidebar, PracticeHeader } from '@/components/practice'
import React from 'react'

function page() {
  return (
    <div>
      <PracticeHeader />
      <div className='mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'>
        <div className='col-span-2 space-y-6'>
            <GenerateTestCard />
        </div>
        <div className='col-span-1'>
          <PerformanceSidebar />
        </div>
      </div>
    </div>
  )
}

export default page
