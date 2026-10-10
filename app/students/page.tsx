import { requireRole } from "@/lib/authorization"
import { SupervisorDashboard } from "@/components/supervisor/supervisor-dashboard"

export default async function StudentsPage() {
  const { profile } = await requireRole("supervisor")

  return <SupervisorDashboard supervisorName={profile.fullName} />
}
