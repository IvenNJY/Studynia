import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

type Tag = { id: string; name: string }

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })

  const search = new URL(request.url).searchParams.get("search")?.trim().toLowerCase() ?? ""
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, updated_at, course_id, note_tag_links(tag_id, note_tags(id, name)), note_favorites(note_id)")
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: "Failed to load notes" }, { status: 500 })

  const notes = (data ?? []).map((note) => {
    const links = (note.note_tag_links ?? []) as Array<{ note_tags?: Tag | Tag[] | null }>
    const tags = links.flatMap((link) => {
      if (!link.note_tags) return []
      return Array.isArray(link.note_tags) ? link.note_tags : [link.note_tags]
    })
    const title = note.title ?? "Untitled note"
    return {
      id: note.id,
      title,
      updated_at: note.updated_at,
      course_id: note.course_id,
      tags,
      favorite: (note.note_favorites ?? []).some((favorite) => favorite.note_id === note.id),
    }
  }).filter((note) => !search || note.title.toLowerCase().includes(search) || note.tags.some((tag) => tag.name.toLowerCase().includes(search)))

  return NextResponse.json(notes)
}
