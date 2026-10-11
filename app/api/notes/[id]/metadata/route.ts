import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

async function authorizedNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, canView: false, canEdit: false }
  const { data: note } = await supabase.from("notes").select("owner_id").eq("id", id).maybeSingle()
  if (note?.owner_id === user.id) return { supabase, user, canView: true, canEdit: true }
  const { data: share } = await supabase.from("note_shares").select("permission_level").eq("note_id", id).eq("shared_with_id", user.id).maybeSingle()
  return { supabase, user, canView: Boolean(share), canEdit: share?.permission_level === "edit" }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user, canView } = await authorizedNote(id)
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  if (!canView) return NextResponse.json({ error: "Note not found" }, { status: 404 })
  const [{ data: favorite }, { data: tags }] = await Promise.all([
    supabase.from("note_favorites").select("note_id").eq("user_id", user.id).eq("note_id", id).maybeSingle(),
    supabase.from("note_tag_links").select("tag_id, note_tags(id, name, course_id)").eq("note_id", id),
  ])
  return NextResponse.json({ favorite: Boolean(favorite), tags: (tags ?? []).map((tag) => tag.note_tags).filter(Boolean) })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user, canEdit } = await authorizedNote(id)
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const body = await request.json() as { favorite?: boolean; tag?: string; tagId?: string; courseId?: string | null }
  if (typeof body.favorite === "boolean") {
    const query = body.favorite
      ? supabase.from("note_favorites").upsert({ user_id: user.id, note_id: id })
      : supabase.from("note_favorites").delete().eq("user_id", user.id).eq("note_id", id)
    const { error } = await query
    if (error) return NextResponse.json({ error: "Failed to update favorite" }, { status: 500 })
  }
  if (body.tag?.trim() || body.tagId) {
    if (!canEdit) return NextResponse.json({ error: "Only note editors can change tags" }, { status: 403 })
    const { data: note } = await supabase.from("notes").select("course_id").eq("id", id).maybeSingle()
    const courseId = body.courseId ?? note?.course_id ?? null
    if (courseId) {
      const { data: course } = await supabase.from("courses").select("id").eq("id", courseId).eq("user_id", user.id).maybeSingle()
      if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    const { data: tag, error: tagError } = body.tagId
      ? await supabase.from("note_tags").update({ course_id: courseId, name: body.tag?.trim() }).eq("id", body.tagId).eq("user_id", user.id).select("id, name, course_id").single()
      : await supabase.from("note_tags").upsert({ user_id: user.id, name: body.tag!.trim(), course_id: courseId }, { onConflict: "user_id,name" }).select("id, name, course_id").single()
    if (tagError || !tag) return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
    const { error } = await supabase.from("note_tag_links").upsert({ note_id: id, tag_id: tag.id })
    if (error) return NextResponse.json({ error: "Failed to tag note" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user, canEdit } = await authorizedNote(id)
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  if (!canEdit) return NextResponse.json({ error: "Only note editors can remove tags" }, { status: 403 })
  const { tagId } = await request.json() as { tagId?: string }
  if (!tagId) return NextResponse.json({ error: "Tag id is required" }, { status: 400 })
  const { error } = await supabase.from("note_tag_links").delete().eq("note_id", id).eq("tag_id", tagId)
  if (error) return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 })
  return NextResponse.json({ success: true })
}
