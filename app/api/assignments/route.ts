import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const { data, error } = await supabase
    .from("assignments")
    .select("id, course_id, title, file_url, due_date, points_possible, is_completed, source")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: "Failed to load assignments" }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json() as {
    course_id?: string
    title?: string
    due_date?: string | null
    file_url?: string | null
    points_possible?: number | null
  }
  if (!body.course_id || !body.title?.trim()) {
    return NextResponse.json({ error: "course_id and title are required" }, { status: 400 })
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", body.course_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      user_id: user.id,
      course_id: body.course_id,
      title: body.title.trim(),
      due_date: body.due_date || null,
      file_url: body.file_url || null,
      points_possible: body.points_possible ?? null,
      source: "local",
    })
    .select("id, course_id, title, file_url, due_date, points_possible, is_completed, source")
    .single()
  if (error) return NextResponse.json({ error: "Failed to save assignment" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
