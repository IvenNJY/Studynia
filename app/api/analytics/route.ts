import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const [
    { data: materials, error: materialsError },
    { data: progress, error: progressError },
    { data: assignments, error: assignmentsError, count: assignmentsDue },
    { data: semesters, error: semestersError },
  ] = await Promise.all([
    supabase.from("materials").select("id, course_id").eq("user_id", user.id),
    supabase.from("material_progress").select("material_id, viewed").eq("user_id", user.id),
    supabase
      .from("assignments")
      .select("id, course_id, title, file_url, due_date, points_possible, is_completed", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .not("due_date", "is", null)
      .gte("due_date", new Date().toISOString())
      .order("due_date", { ascending: true })
      .limit(1),
    supabase.from("gpa_progression").select("id, semester, semester_order, gpa").eq("user_id", user.id).order("semester_order", { ascending: true }),
  ])

  if (materialsError || progressError || assignmentsError || semestersError) {
    console.error("Analytics load error:", materialsError || progressError || assignmentsError || semestersError)
    return NextResponse.json({ error: "Failed to load performance analytics" }, { status: 500 })
  }

  const viewedIds = new Set((progress ?? []).filter((row) => row.viewed).map((row) => row.material_id))
  const moduleStats = {
    mastered: (progress ?? []).filter((row) => row.viewed).length,
    reviewing: Math.max(0, (materials ?? []).length - viewedIds.size),
    inProgress: (materials ?? []).filter((material) => !viewedIds.has(material.id)).length,
  }

  return NextResponse.json({
    semesters: semesters ?? [],
    currentGpa: (semesters ?? []).at(-1)?.gpa ?? null,
    modules: moduleStats,
    assignmentsDue: assignmentsDue ?? 0,
    assignments: assignments ?? [],
  })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json() as { id?: string }
  if (!body.id) return NextResponse.json({ error: "GPA entry id is required" }, { status: 400 })

  const { error } = await supabase
    .from("gpa_progression")
    .delete()
    .eq("id", body.id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: "Failed to delete GPA" }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const body = await request.json() as { semester?: string; semester_order?: number; gpa?: number | null }
  if (!body.semester?.trim() || typeof body.semester_order !== "number") {
    return NextResponse.json({ error: "semester and semester_order are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("gpa_progression")
    .upsert({
      user_id: user.id,
      semester: body.semester.trim(),
      semester_order: body.semester_order,
      gpa: body.gpa ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,semester" })
    .select("id, semester, semester_order, gpa")
    .single()
  if (error) return NextResponse.json({ error: "Failed to save GPA" }, { status: 500 })
  return NextResponse.json(data)
}
