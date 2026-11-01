import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

type RouteContext = { params: Promise<{ materialId: string }> }

async function getUserClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { supabase, user, error }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { materialId } = await params
  const { supabase, user, error: authError } = await getUserClient()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json() as { title?: string; file_url?: string }
  if (!body.title?.trim() || !body.file_url?.trim()) {
    return NextResponse.json({ error: "Title and file URL are required" }, { status: 400 })
  }

  const { data, error } = await supabase.from("materials")
    .update({ title: body.title.trim(), file_url: body.file_url.trim() })
    .eq("id", materialId)
    .eq("user_id", user.id)
    .eq("source", "local")
    .select("id, title, file_url, content_type")
    .maybeSingle()

  if (error) return NextResponse.json({ error: "Failed to update material" }, { status: 500 })
  if (!data) return NextResponse.json({ error: "User-added material not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { materialId } = await params
  const { supabase, user, error: authError } = await getUserClient()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const { error, count } = await supabase.from("materials")
    .delete({ count: "exact" })
    .eq("id", materialId)
    .eq("user_id", user.id)
    .eq("source", "local")

  if (error) return NextResponse.json({ error: "Failed to delete material" }, { status: 500 })
  if (!count) return NextResponse.json({ error: "User-added material not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
