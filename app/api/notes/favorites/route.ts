import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const { data, error } = await supabase.from("note_favorites").select("note_id, notes(id, title, course_id, updated_at)").eq("user_id", user.id).order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 })
  return NextResponse.json((data ?? []).map((entry) => entry.notes).filter(Boolean))
}
