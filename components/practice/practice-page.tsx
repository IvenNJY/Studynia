"use client"

import { useEffect, useState } from "react"
import { GenerateTestCard, PerformanceSidebar, PracticeHeader } from "@/components/practice"
import type { SharedAssessmentUser } from "@/components/practice"

export function PracticePage() {
  const [sharedUsers, setSharedUsers] = useState<SharedAssessmentUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState("mine")

  useEffect(() => {
    fetch("/api/attempts/shared")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Failed to load shared assessments")))
      .then((data: { users?: SharedAssessmentUser[] }) => setSharedUsers(data.users || []))
      .catch((error) => console.error("Error loading shared assessments:", error))
  }, [])

  const selectedUser = sharedUsers.find((user) => user.id === selectedUserId)
  const viewingSharedResults = Boolean(selectedUser)

  return (
    <div>
      <PracticeHeader
        sharedUsers={sharedUsers}
        selectedUserId={selectedUserId}
        onSelectedUserChange={setSelectedUserId}
      />
      <div className="mt-6 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!viewingSharedResults && (
          <div className="col-span-2 space-y-6">
            <GenerateTestCard />
          </div>
        )}
        <div className={viewingSharedResults ? "col-span-3" : "col-span-1"}>
          <PerformanceSidebar sharedAttempts={selectedUser?.attempts} sharedUserName={selectedUser?.name} />
        </div>
      </div>
    </div>
  )
}
