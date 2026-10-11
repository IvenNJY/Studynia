import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

const admin = () => createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getCurrentUser() {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  return user
}

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser()
  const { attemptId } = await params
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const supabase = admin()
  const { data: attempt } = await supabase.from("assessment_attempts").select("id, user_id").eq("id", attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== user.id) return NextResponse.json({ error: "Only the assessment owner can manage sharing" }, { status: 403 })
  const { data, error } = await supabase.from("assessment_shares").select("id, shared_with_id, created_at, profiles!shared_with_id(id, full_name)").eq("attempt_id", attemptId)
  if (error) return NextResponse.json({ error: "Failed to load shares" }, { status: 500 })
  return NextResponse.json({ shares: data ?? [] })
}

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser()
  const { attemptId } = await params
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const { email } = await request.json() as { email?: string }
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) return NextResponse.json({ error: "Email is required" }, { status: 400 })
  const supabase = admin()
  const { data: attempt } = await supabase.from("assessment_attempts").select("id, user_id").eq("id", attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== user.id) return NextResponse.json({ error: "Only the assessment owner can share this attempt" }, { status: 403 })
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) return NextResponse.json({ error: "Failed to find user" }, { status: 500 })
  const recipient = users.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail)
  if (!recipient || recipient.id === user.id) return NextResponse.json({ error: "No other StudyNia user was found with that email" }, { status: 404 })
  const { error } = await supabase.from("assessment_shares").upsert({ attempt_id: attemptId, shared_with_id: recipient.id }, { onConflict: "attempt_id,shared_with_id" })
  if (error) return NextResponse.json({ error: "Failed to share assessment" }, { status: 500 })
  const { error: notificationError } = await supabase.from("inbox_notifications").insert({
    recipient_id: recipient.id,
    actor_id: user.id,
    notification_type: "assessment_share",
    attempt_id: attemptId,
    title: "An assessment was shared with you",
    body: "Open the Assessment Centre to review the shared results.",
  })
  if (notificationError) return NextResponse.json({ error: `Assessment shared, but inbox notification failed: ${notificationError.message}` }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser()
  const { attemptId } = await params
  if (!user) return NextResponse.json({ error: "Auth session missing" }, { status: 401 })
  const { sharedWithId } = await request.json() as { sharedWithId?: string }
  const supabase = admin()
  const { data: attempt } = await supabase.from("assessment_attempts").select("user_id").eq("id", attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== user.id) return NextResponse.json({ error: "Only the assessment owner can manage sharing" }, { status: 403 })
  const { error } = await supabase.from("assessment_shares").delete().eq("attempt_id", attemptId).eq("shared_with_id", sharedWithId || "")
  if (error) return NextResponse.json({ error: "Failed to remove share" }, { status: 500 })
  return NextResponse.json({ success: true })
}
