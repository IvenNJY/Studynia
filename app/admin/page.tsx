import { requireRole } from "@/lib/authorization"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { createClient } from "@/lib/server"

export default async function AdminPage() {
	const { profile, user } = await requireRole("admin")
	const supabase = await createClient()
	const { data: users } = await supabase
		.from("profiles")
		.select("id, full_name, role, institution_name, updated_at")
		.order("updated_at", { ascending: false })

	return (
		<AdminDashboard
			administratorName={profile.fullName}
			currentUserId={user.id}
			users={users ?? []}
		/>
	)
}
