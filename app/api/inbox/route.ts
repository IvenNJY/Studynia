import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const { data, error } = await supabase
    .from("inbox_notifications")
    .select("id, notification_type, note_id, attempt_id, assessment_id, title, body, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const { id } = await request.json() as { id?: string }
  if (!id) return NextResponse.json({ error: "Notification id is required" }, { status: 400 })
  const { error } = await supabase.from("inbox_notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("recipient_id", user.id)
  if (error) return NextResponse.json({ error: "Failed to mark notification read" }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const { id } = await request.json() as { id?: string }
  if (!id) return NextResponse.json({ error: "Notification id is required" }, { status: 400 })
  const { error } = await supabase
    .from("inbox_notifications")
    .delete()
    .eq("id", id)
    .eq("recipient_id", user.id)
  if (error) return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  return NextResponse.json({ success: true })
}
