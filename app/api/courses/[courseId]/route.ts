import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

type RouteContext = { params: Promise<{ courseId: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json() as { course_name?: string; course_code?: string; description?: string }
  if (!body.course_name?.trim()) return NextResponse.json({ error: "Course name is required" }, { status: 400 })

  const { data: course, error: courseError } = await supabase.from("courses")
    .select("id, lms_external_id").eq("id", courseId).eq("user_id", user.id).maybeSingle()
  if (courseError) return NextResponse.json({ error: "Failed to load course" }, { status: 500 })
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
  if (course.lms_external_id?.trim()) return NextResponse.json({ error: "Canvas courses cannot be edited here" }, { status: 403 })

  const { data, error } = await supabase.from("courses")
    .update({
      course_name: body.course_name.trim(),
      course_code: body.course_code?.trim() || null,
      description: body.description?.trim() || null,
    })
    .eq("id", courseId)
    .eq("user_id", user.id)
    .select("id, course_name, course_code, description, lms_external_id")
    .maybeSingle()

  if (error) return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Course not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const { data: course, error: courseError } = await supabase.from("courses")
    .select("id, lms_external_id").eq("id", courseId).eq("user_id", user.id).maybeSingle()
  if (courseError) return NextResponse.json({ error: "Failed to load course" }, { status: 500 })
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
  if (course.lms_external_id?.trim()) return NextResponse.json({ error: "Canvas courses cannot be deleted here" }, { status: 403 })

  const { error, count } = await supabase.from("courses")
    .delete({ count: "exact" })
    .eq("id", courseId)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: "Could not delete this course. Remove linked records first." }, { status: 409 })
  if (!count) return NextResponse.json({ error: "Course not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
