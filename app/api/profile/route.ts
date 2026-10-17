import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { createClient as createServerClient } from "@/lib/server"

export async function PATCH(request: Request) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json().catch(() => null) as {
    full_name?: unknown
    institution_name?: unknown
  } | null
  if (!body || typeof body.full_name !== "string" || typeof body.institution_name !== "string") {
    return NextResponse.json({ error: "Full name and institution must be text values" }, { status: 400 })
  }

  const fullName = body.full_name.trim()
  const institutionName = body.institution_name.trim()
  if (fullName.length > 120 || institutionName.length > 200) {
    return NextResponse.json({ error: "Full name or institution is too long" }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName || null,
      institution_name: institutionName || null,
    }, { onConflict: "id" })
  if (error) {
    console.error("Profile update failed:", error)
    return NextResponse.json({ error: "Could not save your personal information" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
