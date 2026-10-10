import { requireRole } from "@/lib/authorization"
import { SupervisorCourseDashboard } from "@/components/supervisor/supervisor-course-dashboard"

export default async function CoursePerformancePage({ params }: { params: Promise<{ id: string }> }) {
	await requireRole("supervisor")
	const { id } = await params

	return <SupervisorCourseDashboard courseId={id} />
}
