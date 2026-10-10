import { requireRole } from "@/lib/authorization"
import { SupervisorStudentDashboard } from "@/components/supervisor/supervisor-student-dashboard"

export default async function StudentPerformancePage({ params }: { params: Promise<{ id: string }> }) {
	await requireRole("supervisor")
	const { id } = await params

	return <SupervisorStudentDashboard studentId={id} />
}