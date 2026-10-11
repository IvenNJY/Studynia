import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET(request: Request) {
  const userClient = await createClient()
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const courseId = new URL(request.url).searchParams.get("course_id")
  let query = userClient
    .from("materials")
    .select("id, course_id, title, content_type, file_url, due_date, source, module_name, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (courseId) query = query.eq("course_id", courseId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: "Failed to load materials" }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const userClient = await createClient()
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json() as {
    course_id?: string
    title?: string
    file_url?: string
    content_type?: "pdf" | "text" | "deadline"
    due_date?: string | null
  }

  if (!body.course_id || !body.title?.trim() || !body.file_url?.trim()) {
    return NextResponse.json({ error: "course_id, title, and file_url are required" }, { status: 400 })
  }

  const { data: course } = await userClient
    .from("courses")
    .select("id")
    .eq("id", body.course_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

  const { data, error } = await userClient
    .from("materials")
    .insert({
      user_id: user.id,
      course_id: body.course_id,
      title: body.title.trim(),
      file_url: body.file_url.trim(),
      content_type: body.content_type ?? "text",
      due_date: body.due_date || null,
      source: "local",
    })
    .select("id, course_id, title, content_type, file_url, due_date, source, module_name, created_at, updated_at")
    .single()

  if (error) {
    console.error("Failed to save material:", error)
    return NextResponse.json({ error: "Failed to save material", details: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
