import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const { data, error } = await supabase
    .from("courses")
    .select("id, course_name, course_code, description, created_at, lms_external_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to load courses:", error)
    return NextResponse.json({ error: "Failed to load courses", details: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json() as { course_name?: string; course_code?: string; description?: string }
  if (!body.course_name?.trim()) return NextResponse.json({ error: "course_name is required" }, { status: 400 })

  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      course_name: body.course_name.trim(),
      course_code: body.course_code?.trim() || null,
      description: body.description?.trim() || null,
    })
    .select("id, course_name, course_code, description, created_at")
    .single()

  if (error) {
    console.error("Failed to create course:", error)
    return NextResponse.json({ error: "Failed to create course", details: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
