import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/server"
import { NextResponse } from "next/server"

const researchFields = "id, user_id, link, display_name, referenced_notes, created_at"

type ResearchPayload = {
  id?: unknown
  link?: unknown
  display_name?: unknown
}

async function getAuthenticatedAdminClient() {
  const supabaseServer = await createServerClient()
  const { data: { user }, error } = await supabaseServer.auth.getUser()

  if (error || !user) {
    return { user: null, supabaseAdmin: null }
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  return { user, supabaseAdmin }
}

function getValidatedFields(body: ResearchPayload) {
  const link = typeof body.link === "string" ? body.link.trim() : ""
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : ""

  if (!displayName || !link) {
    return { error: "Title and link are required" }
  }

  try {
    const url = new URL(link)
    if (!["http:", "https:"].includes(url.protocol)) {
      return { error: "Link must be an HTTP or HTTPS URL" }
    }
  } catch {
    return { error: "Enter a valid URL" }
  }

  return { fields: { link, display_name: displayName } }
}

export async function GET() {
  const { user, supabaseAdmin } = await getAuthenticatedAdminClient()

  if (!user || !supabaseAdmin) {
    return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from("research")
    .select(researchFields)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Research load error:", error)
    return NextResponse.json({ error: "Failed to load research" }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { user, supabaseAdmin } = await getAuthenticatedAdminClient()

  if (!user || !supabaseAdmin) {
    return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  }

  const body = await request.json() as ResearchPayload
  const validation = getValidatedFields(body)

  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("research")
    .insert({ user_id: user.id, ...validation.fields })
    .select(researchFields)
    .single()

  if (error) {
    console.error("Research create error:", error)
    return NextResponse.json({ error: "Failed to add research" }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const { user, supabaseAdmin } = await getAuthenticatedAdminClient()

  if (!user || !supabaseAdmin) {
    return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  }

  const body = await request.json() as ResearchPayload
  const id = typeof body.id === "string" ? body.id : ""
  const validation = getValidatedFields(body)

  if (!id) {
    return NextResponse.json({ error: "Research id is required" }, { status: 400 })
  }

  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("research")
    .update(validation.fields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(researchFields)
    .maybeSingle()

  if (error) {
    console.error("Research update error:", error)
    return NextResponse.json({ error: "Failed to update research" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Research not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { user, supabaseAdmin } = await getAuthenticatedAdminClient()

  if (!user || !supabaseAdmin) {
    return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  }

  const body = await request.json() as ResearchPayload
  const id = typeof body.id === "string" ? body.id : ""

  if (!id) {
    return NextResponse.json({ error: "Research id is required" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("research")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("Research delete error:", error)
    return NextResponse.json({ error: "Failed to delete research" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Research not found" }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
