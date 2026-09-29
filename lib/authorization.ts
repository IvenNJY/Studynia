import { redirect } from "next/navigation"

import { createClient } from "@/lib/server"

export const roles = ["student", "supervisor", "admin"] as const
export type Role = (typeof roles)[number]

function isRole(value: string | null): value is Role {
	return value !== null && roles.includes(value as Role)
}

/** Require an authenticated user with one of the supplied profile roles. */
export async function requireRole(requiredRoles: Role | readonly Role[]) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect("/auth/login")
	}

	const { data: profile, error } = await supabase
		.from("profiles")
		.select("id, full_name, role")
		.eq("id", user.id)
		.maybeSingle()

	if (error || !profile || !isRole(profile.role)) {
		redirect("/auth/error?error=Your profile could not be loaded")
	}

	const allowedRoles = Array.isArray(requiredRoles)
		? requiredRoles
		: [requiredRoles]

	if (!allowedRoles.includes(profile.role)) {
		redirect("/auth/error?error=You do not have permission to view this page")
	}

	return {
		user,
		profile: {
			id: profile.id,
			fullName: profile.full_name,
			role: profile.role,
		},
	}
}
