import { Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type SharedAssessmentUser = {
  id: string
  name: string
  attempts: Array<{ id: string; score: number; created_at: string; assessments?: { title?: string | null; difficulty_level?: string | null } | null }>
}

export function PracticeHeader({
  sharedUsers = [],
  selectedUserId,
  onSelectedUserChange,
}: {
  sharedUsers?: SharedAssessmentUser[]
  selectedUserId?: string
  onSelectedUserChange?: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Assessment Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Validate your understanding through AI-generated retrieval practice.
        </p>
      </div>
      {sharedUsers.length > 0 && onSelectedUserChange && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedUserId || "mine"} onValueChange={(value) => value && onSelectedUserChange(value)}>
            <SelectTrigger className="min-w-48">
              <SelectValue placeholder="View shared results" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My assessments</SelectItem>
              {sharedUsers.map((sharedUser) => (
                <SelectItem key={sharedUser.id} value={sharedUser.id}>
                  {sharedUser.name}&apos;s assessments
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
