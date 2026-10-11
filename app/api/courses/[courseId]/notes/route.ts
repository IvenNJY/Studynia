import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

  const [{ data: directNotes, error: directError }, { data: courseTags, error: tagsError }] = await Promise.all([
    supabase.from("notes").select("id, title, content, updated_at, course_id").eq("course_id", courseId).eq("is_archived", false),
    supabase.from("note_tags").select("id").eq("course_id", courseId).eq("user_id", user.id),
  ])
  if (directError || tagsError) return NextResponse.json({ error: "Failed to load linked notes" }, { status: 500 })

  const tagIds = (courseTags ?? []).map((tag) => tag.id)
  const { data: taggedLinks, error: linksError } = tagIds.length
    ? await supabase.from("note_tag_links").select("note_id").in("tag_id", tagIds)
    : { data: [], error: null }
  if (linksError) return NextResponse.json({ error: "Failed to load tagged notes" }, { status: 500 })

  const taggedIds = [...new Set((taggedLinks ?? []).map((link) => link.note_id))]
  const { data: taggedNotes, error: taggedError } = taggedIds.length
    ? await supabase.from("notes").select("id, title, content, updated_at, course_id").in("id", taggedIds).eq("is_archived", false)
    : { data: [], error: null }
  if (taggedError) return NextResponse.json({ error: "Failed to load tagged notes" }, { status: 500 })

  const notes = [...(directNotes ?? []), ...(taggedNotes ?? [])]
  const uniqueNotes = [...new Map(notes.map((note) => [note.id, note])).values()]
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
  return NextResponse.json(uniqueNotes)
}
