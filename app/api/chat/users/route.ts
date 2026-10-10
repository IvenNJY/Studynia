import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET() {
	const client = await createClient()
	const { data: { user } } = await client.auth.getUser()
	if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
	const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
	const { data, error } = await admin.from("profiles").select("id, full_name, role").neq("id", user.id).order("full_name")
	if (error) return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
	return NextResponse.json({ users: (data ?? []).map((profile) => ({ id: profile.id, name: profile.full_name || "Unnamed user", role: profile.role })) })
}
